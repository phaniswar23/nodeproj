import express from 'express';
import User from '../models/User.js';
import ProfileStats from '../models/ProfileStats.js';
import protect from '../middleware/auth.js';

const router = express.Router();

// @desc    Delete user account
// @route   DELETE /api/account
// @access  Private
router.delete('/', protect, async (req, res) => {
    try {
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ message: 'Password required' });
        }

        const user = await User.findById(req.user._id).select('+password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify Password
        if (!(await user.matchPassword(password))) {
            return res.status(401).json({ message: 'Incorrect password' });
        }

        // Delete User Data & Sub-resources
        await ProfileStats.deleteOne({ user_id: user._id });
        await User.deleteOne({ _id: user._id });

        res.json({ success: true, message: 'Account deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
