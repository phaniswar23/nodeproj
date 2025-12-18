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

        // Ensure profile object exists
        if (!user.profile) user.profile = {};

        // Update Info Fields
        if (displayName !== undefined) user.profile.display_name = displayName;
        if (bio !== undefined) user.profile.bio = bio;
        if (instagramUsername !== undefined) user.profile.instagram_username = instagramUsername;
        if (discordLink !== undefined) user.profile.discord_link = discordLink;
        if (privateProfile !== undefined) user.profile.is_private = privateProfile;

        // Update Visuals (Consolidated)
        if (avatarId !== undefined) {
            // Allow null/empty to reset
            if (avatarId === null) {
                user.profile.avatarId = 'avatar_default';
            } else {
                user.profile.avatarId = avatarId;
            }
            // Sync legacy URL
            user.avatar_url = user.profile.avatarId.startsWith('http') || user.profile.avatarId.startsWith('data:')
                ? user.profile.avatarId : `https://api.dicebear.com/7.x/${(user.profile.avatarId.includes('Gamer') || user.profile.avatarId.includes('Cyber') || user.profile.avatarId.includes('Bot')) ? 'bottts' : 'avataaars'}/svg?seed=${user.profile.avatarId}`;
        }

        if (banner !== undefined) {
            if (banner.type && banner.value) {
                user.profile.banner = banner;
                user.banner_url = banner.value; // Sync legacy
            }
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

// @desc    Update avatar only
// @route   PUT /api/profile/avatar
// @access  Private
router.put('/avatar', protect, async (req, res) => {
    try {
        const { avatarId } = req.body; // Expecting { avatarId: "string" }

        if (!avatarId) return res.status(400).json({ message: "Avatar ID is required" });

        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (!user.profile) user.profile = {};
        user.profile.avatarId = avatarId;

        // Sync Legacy
        // (Simplified generation for brevity, main logic in shared util is better but this works)
        const isUrl = avatarId.startsWith('http') || avatarId.startsWith('data:');
        user.avatar_url = isUrl ? avatarId : `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarId}`;

        await user.save();
        res.json({ success: true, avatarId: user.profile.avatarId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

// @desc    Update banner only
// @route   PUT /api/profile/banner
// @access  Private
router.put('/banner', protect, async (req, res) => {
    try {
        const { banner } = req.body; // Expecting { banner: { type, value } }

        if (!banner || !banner.value) return res.status(400).json({ message: "Valid banner object required" });

        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (!user.profile) user.profile = {};
        user.profile.banner = banner;
        user.banner_url = banner.value;

        await user.save();
        res.json({ success: true, banner: user.profile.banner });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

export default router;
