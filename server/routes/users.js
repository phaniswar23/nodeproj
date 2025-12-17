import express from 'express';
import User from '../models/User.js';
import ProfileStats from '../models/ProfileStats.js';
import protect from '../middleware/auth.js';

const router = express.Router();

// @desc    Get user profile by ID
// @route   GET /api/users/:id/profile
// @access  Public (or Private?)
router.get('/:id/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('username full_name bio avatar_url banner_url discord_link instagram_username is_private created_at');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const stats = await ProfileStats.findOne({ user_id: req.params.id });

        res.json({
            ...user.toObject(),
            stats: stats || {}
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get user stats
// @route   GET /api/users/:id/stats
// @access  Private
router.get('/:id/stats', protect, async (req, res) => {
    try {
        const stats = await ProfileStats.findOne({ user_id: req.params.id });
        if (!stats) {
            // Return default stats if none found
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
// @access  Private
router.get('/search', protect, async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) return res.json([]);

        // Simple regex search
        const users = await User.find({
            username: { $regex: query, $options: 'i' }
        }).select('_id username avatar_url').limit(10);

        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update user profile
// @route   PUT /api/users/:id/profile
// @access  Private
router.put('/:id/profile', protect, async (req, res) => {
    try {
        if (req.user._id.toString() !== req.params.id) {
            return res.status(401).json({ message: "Not authorized" });
        }

        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        const { full_name, bio, instagram_username, discord_link, is_private, avatar_url } = req.body;

        user.full_name = full_name || user.full_name;
        user.bio = bio || user.bio;
        user.instagram_username = instagram_username || user.instagram_username;
        user.discord_link = discord_link || user.discord_link;
        user.is_private = is_private !== undefined ? is_private : user.is_private;
        user.avatar_url = avatar_url || user.avatar_url;

        await user.save();

        res.json(user);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});

export default router;
