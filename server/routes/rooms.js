import express from 'express';
import Room from '../models/Room.js';
import RoomPlayer from '../models/RoomPlayer.js';
import Message from '../models/Message.js';
import protect from '../middleware/auth.js';
import mongoose from 'mongoose'; // Added import
import { v4 as uuidv4 } from 'uuid'; // Actually we might use shortid or custom code.
// For now, let's just use a simple random string generator for room codes

const router = express.Router();

// Middleware to validate ID
const validateId = (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ message: 'Invalid Room ID' });
    }
    next();
};

const generateRoomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

// @desc    Create a room
// @route   POST /api/rooms
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        const { title, numRounds, votingTime, responseTime, wordDifficulty, customWords } = req.body;

        // Validation for custom difficulty
        if (wordDifficulty === 'custom') {
            if (!customWords || !Array.isArray(customWords) || customWords.length < 20) {
                return res.status(400).json({ message: 'Custom mode requires at least 20 word pairs' });
            }
            if (customWords.length > 500) {
                return res.status(400).json({ message: 'Custom words limit is 500 pairs' });
            }
        }

        const code = generateRoomCode();
        // TODO: check for collision

        const room = await Room.create({
            join_code: code,
            owner_id: req.user._id,
            title: title || `${req.user.username}'s Room`,
            num_rounds: numRounds,
            voting_time: votingTime,
            response_time: responseTime,
            word_difficulty: wordDifficulty,
            custom_words: customWords // Add custom words if present
        });

        // Add owner as a player
        await RoomPlayer.create({
            room_id: room._id,
            user_id: req.user._id,
            is_approved: true
        });

        res.status(201).json(room);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get room by ID or Code
// @route   GET /api/rooms/:idOrCode
// @access  Private
router.get('/:idOrCode', protect, async (req, res) => {
    try {
        const input = req.params.idOrCode;
        let room;

        if (mongoose.Types.ObjectId.isValid(input)) {
            room = await Room.findById(input);
        }

        // If not found by ID or invalid ID, try by code (only if not found yet)
        if (!room) {
            room = await Room.findOne({ join_code: input });
        }

        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        const players = await RoomPlayer.find({ room_id: room._id }).populate('user_id', 'username avatar_url');

        res.json({
            ...room.toObject(),
            players
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});


// @desc    Join a room by code
// @route   POST /api/rooms/join
// @access  Private
router.post('/join', protect, async (req, res) => {
    try {
        const { joinCode } = req.body;
        const room = await Room.findOne({ join_code: joinCode });

        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        if (room.status !== 'waiting') {
            return res.status(400).json({ message: 'Game already in progress' });
        }

        // Check if already joined
        const existingPlayer = await RoomPlayer.findOne({ room_id: room._id, user_id: req.user._id });
        if (existingPlayer) {
            return res.json({ roomId: room._id });
        }

        // Create player
        await RoomPlayer.create({
            room_id: room._id,
            user_id: req.user._id,
            is_approved: true, // Default to true for now
            is_ready: false
        });

        // RESET ALL PLAYERS TO NOT READY (Safety rule: new player = new consensus needed)
        await RoomPlayer.updateMany({ room_id: room._id }, { is_ready: false });

        // Emit update to room
        const io = req.app.get('socketio');
        if (io) {
            io.to(room._id.toString()).emit('room_update');
        }

        res.json({ roomId: room._id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get room players
// @route   GET /api/rooms/:id/players
// @access  Private
router.get('/:id/players', protect, async (req, res) => {
    try {
        let roomId = req.params.id;

        // If not ObjectId, assume it's a join code
        if (!mongoose.Types.ObjectId.isValid(roomId)) {
            const room = await Room.findOne({ join_code: roomId });
            if (!room) {
                return res.status(404).json({ message: 'Room not found' });
            }
            roomId = room._id;
        }

        const players = await RoomPlayer.find({ room_id: roomId })
            .populate('user_id', 'username full_name avatar_url');

        // Transform slightly to match expected "profile" structure if needed
        // Frontend expects: { ...player, profile: { username, full_name, avatar_url } }
        // populate puts it in user_id field.
        const formattedPlayers = players.map(p => ({
            _id: p._id,
            id: p._id,
            user_id: p.user_id._id,
            room_id: p.room_id,
            score: p.score,
            is_approved: p.is_approved,
            is_ready: p.is_ready, // Added is_ready
            profile: p.user_id
        }));

        res.json(formattedPlayers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Toggle Ready Status
// @route   PUT /api/rooms/:id/ready
// @access  Private
router.put('/:id/ready', protect, validateId, async (req, res) => {
    try {
        const player = await RoomPlayer.findOne({ room_id: req.params.id, user_id: req.user._id });

        if (!player) {
            return res.status(404).json({ message: 'Player not found in room' });
        }

        // Toggle ready status
        player.is_ready = !player.is_ready;
        await player.save();

        const io = req.app.get('socketio');
        if (io) {
            io.to(req.params.id).emit('room_update');
        }

        res.json(player);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Send Lobby Message
// @route   POST /api/rooms/:id/messages
// @access  Private
router.post('/:id/messages', protect, validateId, async (req, res) => {
    try {
        const { content } = req.body;

        // Use dynamic import for Message model if not globally available or ensure import
        // Assuming Message is imported at top of file. If not, I should check.
        // Let's assume standard import for now, or use mongoose.model
        const Message = mongoose.model('Message');

        const message = await Message.create({
            room_id: req.params.id,
            sender: req.user._id,
            content,
            type: 'user'
        });

        const populatedMessage = await message.populate('sender', 'username avatar_url');

        const io = req.app.get('socketio');
        if (io) {
            io.to(req.params.id).emit('new_message', populatedMessage);
        }

        res.json(populatedMessage);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});


// @desc    Get Lobby Messages
// @route   GET /api/rooms/:id/messages
// @access  Private
router.get('/:id/messages', protect, validateId, async (req, res) => {
    try {
        const Message = mongoose.model('Message');
        const messages = await Message.find({ room_id: req.params.id })
            .sort({ createdAt: 1 })
            .limit(50) // Limit history
            .populate('sender', 'username avatar_url');

        res.json(messages);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});


// @desc    Approve/Update player
// @route   PUT /api/rooms/:id/players/:playerId
// @access  Private (Owner only ideally, but we'll check room ownership)
router.put('/:id/players/:playerId', protect, validateId, async (req, res) => {
    try {
        const { is_approved } = req.body;

        // Ensure playerId is also valid
        if (!mongoose.Types.ObjectId.isValid(req.params.playerId)) {
            return res.status(400).json({ message: 'Invalid Player ID' });
        }

        // Find room to check owner
        const room = await Room.findById(req.params.id);
        if (!room) return res.status(404).json({ message: 'Room not found' });

        if (room.owner_id.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const player = await RoomPlayer.findById(req.params.playerId);
        if (!player) return res.status(404).json({ message: 'Player not found' });

        if (is_approved !== undefined) player.is_approved = is_approved;
        await player.save();

        res.json(player);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update room settings
// @route   PUT /api/rooms/:id
// @access  Private (Owner only)
router.put('/:id', protect, validateId, async (req, res) => {
    try {
        const room = await Room.findById(req.params.id);

        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        // Verify Owner
        if (room.owner_id.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        // Update fields
        const { numRounds, responseTime, votingTime, wordDifficulty } = req.body;

        if (numRounds) room.num_rounds = numRounds;
        if (responseTime) room.response_time = responseTime;
        if (votingTime) room.voting_time = votingTime;
        if (wordDifficulty) room.word_difficulty = wordDifficulty;

        await room.save();

        // Socket Emit
        const io = req.app.get('socketio');
        if (io) {
            io.to(room._id.toString()).emit('room_update');
        }

        res.json(room);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Remove player
// @route   DELETE /api/rooms/:id/players/:playerId
// @access  Private
router.delete('/:id/players/:playerId', protect, validateId, async (req, res) => {
    try {
        // Allow user to remove themselves OR owner to remove others
        const room = await Room.findById(req.params.id);
        if (!room) return res.status(404).json({ message: 'Room not found' });

        // If "me" alias used
        let targetPlayerId = req.params.playerId;
        if (targetPlayerId === 'me') {
            const myPlayer = await RoomPlayer.findOne({ room_id: room._id, user_id: req.user._id });
            if (!myPlayer) return res.status(404).json({ message: 'Not in room' });
            targetPlayerId = myPlayer._id;
        }

        const player = await RoomPlayer.findById(targetPlayerId);
        if (!player) return res.status(404).json({ message: 'Player not found' });

        const isSelf = player.user_id.toString() === req.user._id.toString();
        const isOwner = room.owner_id.toString() === req.user._id.toString();

        if (!isSelf && !isOwner) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        await RoomPlayer.findByIdAndDelete(targetPlayerId);

        res.json({ message: 'Player removed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Start game
// @desc    Start game
// @route   POST /api/rooms/:id/start
// @access  Private (Owner only)
router.post('/:id/start', protect, validateId, async (req, res) => {
    try {
        const room = await Room.findById(req.params.id);
        if (!room) return res.status(404).json({ message: 'Room not found' });

        if (room.owner_id.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        room.status = 'playing';
        room.current_round = 1;

        // Initialize game state with words (Mocking for now, or fetch from DB/List)
        // Ideally we pick words here.
        const mockWords = { main: "Apple", imposter: "Orange" };

        // Find players to pick imposter
        const players = await RoomPlayer.find({ room_id: room._id, is_approved: true });
        if (players.length > 0) {
            const imposterIndex = Math.floor(Math.random() * players.length);
            const imposter = players[imposterIndex];

            room.game_state = {
                phase: 'word',
                word_pair: mockWords,
                imposter_id: imposter.user_id,
                response_order: players.map(p => p.user_id).sort(() => Math.random() - 0.5),
                current_player_index: 0,
                responses: {},
                votes: {}
            };
        }

        await room.save();

        const io = req.app.get('socketio');
        if (io) {
            io.to(req.params.id).emit('game_update', {
                type: 'start_round',
                wordPair: room.game_state.word_pair,
                imposterId: room.game_state.imposter_id,
                responseOrder: room.game_state.response_order
            });
        }

        res.json(room);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});

export default router;
