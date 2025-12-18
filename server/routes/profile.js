import express from 'express';
import User from '../models/User.js';
import protect from '../middleware/auth.js';

const router = express.Router();

// @desc    Update entire user profile (Info + Visuals)
// @route   PUT /api/profile
// @access  Private
// @desc    Update entire user profile (Info + Visuals)
// @route   PUT /api/profile
// @access  Private
router.put('/', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const {
            displayName,
            bio,
            instagramUsername,
            discordLink,
            privateProfile,
            avatarId,
            banner
        } = req.body;

        // Update Info Fields
        if (displayName !== undefined) user.profile.display_name = displayName;
        if (bio !== undefined) user.profile.bio = bio;
        if (instagramUsername !== undefined) user.profile.instagram_username = instagramUsername;
        if (discordLink !== undefined) user.profile.discord_link = discordLink;
        if (privateProfile !== undefined) user.profile.is_private = privateProfile;

        // Update Visuals
        if (avatarId !== undefined) {
            // Basic validation: ensure it's a string
            if (typeof avatarId !== 'string') return res.status(400).json({ message: 'Invalid avatarId format' });

            // Allow null/empty to reset? Prompt says "avatarId (string OR null)"
            // If null, we might fallback to default.
            if (avatarId === null) {
                user.profile.avatarId = 'avatar_default';
            } else {
                user.profile.avatarId = avatarId;
            }

            // Sync legacy avatar_url
            // If it is a presets ID (starts with av-), generate URL. If it's a custom URL, use it.
            // If it's 'avatar_default', use default.
            if (user.profile.avatarId === 'avatar_default') {
                user.avatar_url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`;
            } else {
                user.avatar_url = user.profile.avatarId.startsWith('http') || user.profile.avatarId.startsWith('data:')
                    ? user.profile.avatarId
                    : `https://api.dicebear.com/7.x/${(user.profile.avatarId.includes('Gamer') || user.profile.avatarId.includes('Cyber') || user.profile.avatarId.includes('Bot')) ? 'bottts' :
                        (user.profile.avatarId.includes('Esports') || user.profile.avatarId.includes('Abstract') || user.profile.avatarId.includes('Minimal')) ? 'identicon' :
                            user.profile.avatarId.includes('Retro') ? 'pixel-art' :
                                'avataaars'
                    }/svg?seed=${user.profile.avatarId}`;
                // Note: The preset URL generation logic is also in frontend. 
                // ideally we store the ID and frontend generates URL, or backend generates URL and saves it. 
                // Prompt says "Backends stores... avatarId". 
                // We are syncing `avatar_url` (legacy) for safety.
            }
        }

        if (banner !== undefined) {
            if (!banner.type || !banner.value) return res.status(400).json({ message: 'Invalid banner format' });
            user.profile.banner = banner;
            user.banner_url = banner.value; // Sync legacy
        }

        // Sync legacy fields
        if (displayName !== undefined) user.full_name = displayName;
        if (bio !== undefined) user.bio = bio;

        await user.save();

        res.json({
            success: true,
            user: {
                _id: user._id,
                username: user.username,
                profile: user.profile
            }
        });
    } catch (error) {
        console.error("Profile update error:", error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
