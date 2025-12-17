import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import ProfileStats from '../models/ProfileStats.js';
import protect from '../middleware/auth.js';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit'; // Add rateLimit import

const router = express.Router();

// Rate limiter: max 100 requests per 15 minutes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { message: 'Too many requests, please try again later.' }
});

// Apply rate limiter to all auth routes
router.use(authLimiter);

// @desc    Check username availability
// @route   POST /api/auth/check-username
// @access  Public
router.post('/check-username', async (req, res) => {
    try {
        const { username } = req.body;

        if (!username || username.length < 3) {
            return res.status(400).json({ message: 'Username too short' });
        }

        const user = await User.findOne({ username });

        if (user) {
            return res.json({ available: false, message: 'Username already taken' });
        }

        res.json({ available: true, message: 'Username available' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Generate JWT
const generateToken = (id, tokenVersion) => {
    return jwt.sign({ id, tokenVersion }, process.env.JWT_SECRET || 'secret', {
        expiresIn: '30d',
    });
};

// @desc    Register new user
// @route   POST /api/auth/signup
// @access  Public
router.post('/signup', async (req, res) => {
    try {
        const { password, username, fullName, hintQuestion, hintAnswer } = req.body;

        if (!password || !username || !fullName || !hintQuestion || !hintAnswer) {
            return res.status(400).json({ message: 'Please add all required fields' });
        }

        // Check if user exists
        const userExists = await User.findOne({ username });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create user
        const user = await User.create({
            password,
            username,
            full_name: fullName,
            hint_question: hintQuestion,
            hint_answer: hintAnswer,
            tokenVersion: 0 // Initialize
        });

        if (user) {
            // Create initial profile stats
            await ProfileStats.create({ user_id: user._id });

            res.status(201).json({
                _id: user.id,
                username: user.username,
                full_name: user.full_name,
                token: generateToken(user._id, user.tokenVersion),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Check for user
        const user = await User.findOne({ username }).select('+password');

        if (user && (await bcrypt.compare(password, user.password))) {

            // Increment token version to invalidate previous tokens
            user.tokenVersion = (user.tokenVersion || 0) + 1;
            await user.save();

            res.json({
                _id: user.id,
                username: user.username,
                full_name: user.full_name,
                token: generateToken(user._id, user.tokenVersion),
            });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
    // req.user is already fetched by protect middleware
    res.json(req.user);
});

// @desc    Init forgot password (find user, return hint question)
// @route   POST /api/auth/forgot-password-init
// @access  Public
router.post('/forgot-password-init', async (req, res) => {
    try {
        const { username } = req.body;
        const user = await User.findOne({ username });

        if (!user) {
            // Generic message for security, though strict requirement said "show generic error messages"
            // but for step 1 we usually need to know if user exists to show question.
            // User requirement: "Show generic error messages (do not reveal which step failed)"
            // implies we shouldn't reveal if user exists?
            // BUT "Reset flow steps: Username verification -> Answer ..."
            // This implies we MUST verify username first.
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            hasHint: true,
            question: user.hint_question
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Verify hint answer and return reset token
// @route   POST /api/auth/verify-hint
// @access  Public
router.post('/verify-hint', async (req, res) => {
    try {
        const { username, answer } = req.body;
        const user = await User.findOne({ username }).select('+hint_answer');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if answer matches hashed value
        if (await bcrypt.compare(answer, user.hint_answer)) {
            // Generate a temporary reset token (valid for 10 mins)
            const resetToken = jwt.sign(
                { id: user._id, type: 'password_reset' },
                process.env.JWT_SECRET || 'secret',
                { expiresIn: '10m' }
            );

            res.json({ success: true, resetToken });
        } else {
            res.status(400).json({ message: 'Incorrect answer' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Update password via token
// @route   POST /api/auth/update-password
// @access  Public
router.post('/update-password', async (req, res) => {
    try {
        const { token, password } = req.body;

        if (!token) {
            return res.status(400).json({ message: 'No token provided' });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');

        if (decoded.type !== 'password_reset') {
            return res.status(400).json({ message: 'Invalid token type' });
        }

        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Set new password
        user.password = password;
        await user.save();

        res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        console.error(error);
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Invalid or expired token' });
        }
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Change password (logged in)
// @route   POST /api/auth/change-password
// @access  Private
router.post('/change-password', protect, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user._id).select('+password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check current password
        if (!(await user.matchPassword(currentPassword))) {
            return res.status(401).json({ message: 'Incorrect current password' });
        }

        // Set new password
        user.password = newPassword;
        await user.save();

        res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
