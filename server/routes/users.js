import express from 'express';
import User from '../models/User.js';
import ProfileStats from '../models/ProfileStats.js';
import protect from '../middleware/auth.js';

const router = express.Router();

// @desc    Get user profile by ID
// @route   GET /api/users/:id/profile
router.get('/:id/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('username full_name profile avatar_url banner_url discord_link instagram_username is_private created_at');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const stats = await ProfileStats.findOne({ user_id: req.params.id });

        // Merge stats with user object, ensure profile object is populated if not present (simple fallback)
        const userObj = user.toObject();
        if (!userObj.profile) {
            userObj.profile = {
                display_name: userObj.full_name,
                bio: userObj.bio,
                avatar: { type: 'preset', value: userObj.avatar_url || '' },
                banner: { type: 'color', value: '#7289da' },
                pronouns: ''
            };
        }

        res.json({
            ...userObj,
            stats: stats || {}
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get user stats
// @route   GET /api/users/:id/stats
router.get('/:id/stats', protect, async (req, res) => {
    try {
        const stats = await ProfileStats.findOne({ user_id: req.params.id });
        if (!stats) {
            return res.json({
                rooms_participated: 0,
                wins: 0,
                losses: 0,
                total_score: 0
            });
        }
        res.json(stats);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Search users
// @route   GET /api/users/search?q=username
router.get('/search', protect, async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) return res.json([]);

        // Simple regex search
        const users = await User.find({
            username: { $regex: query, $options: 'i' }
        }).select('_id username profile.avatar avatar_url').limit(10);

        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update user profile & settings
// @route   PUT /api/users/:id/profile
// @access  Private
router.put('/:id/profile', protect, async (req, res) => {
    try {
        if (req.user._id.toString() !== req.params.id) {
            return res.status(401).json({ message: "Not authorized" });
        }

        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        // Update Logic ensuring sub-documents are handled correctly
        const updates = req.body;

        // Handle root fields
        if (updates.full_name) user.full_name = updates.full_name;

        // Handle new Profile Object Structure
        // Use merge or direct assignment, being careful not to overwrite with undefined
        if (!user.profile) user.profile = {};

        if (updates.profile) {
            const p = updates.profile;
            if (p.display_name) user.profile.display_name = p.display_name;
            if (p.pronouns !== undefined) user.profile.pronouns = p.pronouns;
            if (p.bio !== undefined) user.profile.bio = p.bio;
            if (p.is_private !== undefined) user.profile.is_private = p.is_private;
            if (p.status !== undefined) user.profile.status = p.status;

            // Assets (Avatar/Banner)
            if (p.avatarId) user.profile.avatarId = p.avatarId;
            // Legacy / Compat support if needed, or remove if strict
            if (p.avatar) {
                // If client sends object, try to extract value, mainly for backward compat handling
                // But sticking to avatarId as primary source of truth
            }

            if (p.banner) {
                user.profile.banner = { ...user.profile.banner, ...p.banner };
                // Back-fill root for compat
                if (p.banner.value) user.banner_url = p.banner.value;
            }

            // Socials
            if (p.discord_link !== undefined) user.profile.discord_link = p.discord_link;
            if (p.instagram_username !== undefined) user.profile.instagram_username = p.instagram_username;
        }
        // Fallback: If client sends root fields (legacy), map them to profile
        else {
            if (updates.bio !== undefined) user.profile.bio = updates.bio;
            if (updates.avatar_url) {
                user.profile.avatar = { type: 'image', value: updates.avatar_url };
                user.avatar_url = updates.avatar_url;
            }
            if (updates.is_private !== undefined) user.profile.is_private = updates.is_private;
        }

        await user.save();
        res.json(user);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});



// @desc    Disable user account
// @route   POST /api/users/disable-account
// @access  Private
router.post('/disable-account', protect, async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.user._id, { is_disabled: true }, { new: true });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({ success: true, message: "Account disabled successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});

export default router;
