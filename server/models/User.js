import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    // Email removed as per requirements
    // email: { type: String, ... }
    password: {
        type: String,
        required: true,
        minlength: 6,
        select: false, // Don't return password by default
    },
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    full_name: {
        type: String,
        required: true,
    },
    avatar_url: {
        type: String,
        default: null,
    },
    banner_url: {
        type: String,
        default: null,
    },
    bio: {
        type: String,
        default: null,
    },
    discord_link: {
        type: String,
        default: null,
    },
    instagram_username: {
        type: String,
        default: null,
    },
    is_private: {
        type: Boolean,
        default: false,
    },
    hint_question: {
        type: String,
        required: true,
    },
    hint_answer: {
        type: String, // Ideally this should be hashed too, but for parity with current app we keep it simple for now, or match current implementation
        required: true,
        select: false,
    },
    tokenVersion: {
        type: Number,
        default: 0,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Match password method
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password reset token
userSchema.methods.getResetPasswordToken = function () {
    // Generate token
    const resetToken =
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);

    // Hash token and set to resetPasswordToken field
    // In a real app we'd hash it. For simplicity we'll store it directly or hash it.
    // Let's store direct for MVP to match "simple" requirement, but hashing is better.
    // We'll store it directly for now as per "simplify" instruction.
    this.resetPasswordToken = resetToken;

    // Set expire (10 minutes)
    this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    return resetToken;
};

// Encrypt password and hint_answer using bcrypt
userSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }

    if (this.isModified('hint_answer')) {
        this.hint_answer = await bcrypt.hash(this.hint_answer, 10);
    }

    next();
});

const User = mongoose.model('User', userSchema);

export default User;
