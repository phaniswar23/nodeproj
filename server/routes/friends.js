import express from 'express';
import FriendRequest from '../models/FriendRequest.js';
import Friendship from '../models/Friendship.js';
import User from '../models/User.js';
import protect from '../middleware/auth.js';

const router = express.Router();

// @desc    Get all friends
// @route   GET /api/friends
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const friendships = await Friendship.find({ user_id: req.user._id })
            .populate('friend_id', 'username full_name avatar_url');

        // Return just the friend objects
        const friends = friendships.map(f => f.friend_id);
        res.json(friends);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get pending requests
// @route   GET /api/friends/requests
// @access  Private
router.get('/requests', protect, async (req, res) => {
    try {
        // Requests SENT to me
        const requests = await FriendRequest.find({
            to_user_id: req.user._id,
            status: 'pending'
        }).populate('from_user_id', 'username avatar_url');

        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Send Friend Request
// @route   POST /api/friends/request
// @access  Private
router.post('/request', protect, async (req, res) => {
    try {
        const { toUserId } = req.body;

        if (toUserId === req.user._id.toString()) {
            return res.status(400).json({ message: "Cannot friend yourself" });
        }

        // Check if already friends
        const existingFriendship = await Friendship.findOne({
            user_id: req.user._id,
            friend_id: toUserId
        });
        if (existingFriendship) {
            return res.status(400).json({ message: "Already friends" });
        }

        // Check for existing request
        const existingRequest = await FriendRequest.findOne({
            from_user_id: req.user._id,
            to_user_id: toUserId,
            status: 'pending'
        });
        if (existingRequest) {
            return res.status(400).json({ message: "Request already sent" });
        }

        await FriendRequest.create({
            from_user_id: req.user._id,
            to_user_id: toUserId
        });

        res.status(200).json({ message: "Friend request sent" });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Accept/Reject Friend Request
// @route   PUT /api/friends/request/:id
// @access  Private
router.put('/request/:id', protect, async (req, res) => {
    try {
        const { status } = req.body; // 'accepted' or 'rejected'
        const requestId = req.params.id;

        const request = await FriendRequest.findById(requestId);

        if (!request) return res.status(404).json({ message: "Request not found" });
        if (request.to_user_id.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: "Not authorized" });
        }

        request.status = status;
        await request.save();

        if (status === 'accepted') {
            // Create bidirectional friendship
            await Friendship.create({ user_id: request.from_user_id, friend_id: request.to_user_id });
            await Friendship.create({ user_id: request.to_user_id, friend_id: request.from_user_id });
        }

        res.json({ message: `Request ${status}` });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
