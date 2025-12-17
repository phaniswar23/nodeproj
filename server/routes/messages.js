import express from 'express';
import protect from '../middleware/auth.js';
import Message from '../models/Message.js';
import User from '../models/User.js';

const router = express.Router();

// @desc    Get chat messages with a friend
// @route   GET /api/messages/:friendId
// @access  Private
router.get('/:friendId', protect, async (req, res) => {
    try {
        const { friendId } = req.params;
        const userId = req.user._id;

        // Ensure friend exists (optional check)
        // const friend = await User.findById(friendId);
        // if (!friend) return res.status(404).json({ message: 'User not found' });

        const messages = await Message.find({
            $or: [
                { sender: userId, receiver: friendId },
                { sender: friendId, receiver: userId }
            ]
        })
            .sort({ createdAt: 1 }); // Oldest first

        res.json(messages);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
