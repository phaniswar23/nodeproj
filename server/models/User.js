import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    // Core Auth
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
        select: false,
    },
    // Deprecated: Migrating to profile.display_name, but keeping for backward compat if needed or mapping it
    full_name: {
        type: String,
        required: true,
    },

    // NEW: Nested Profile Object
    profile: {
        display_name: { type: String, default: '' },
        bio: { type: String, default: '' },

        // Asset System
        // Avatar: Stored as ID string (e.g. 'avatar_023') or URL for uploads
        avatarId: { type: String, default: 'avatar_default' },

        // Banner: Stored as object { type, value }
        banner: {
            type: { type: String, enum: ['color', 'image', 'gradient', 'preset'], default: 'color' },
            value: { type: String, default: '#7289da' } // Default Discord-ish blurple
        },

        // Socials
        discord_link: { type: String, default: '' },
        instagram_username: { type: String, default: '' },

        // Settings
        is_private: { type: Boolean, default: false },
    },

    // Legacy/Root fields mapping (optional cleanup later, keeping for safety now)
    avatar_url: { type: String, default: null }, // Deprecated in favor of profile.avatar
    banner_url: { type: String, default: null }, // Deprecated in favor of profile.banner
    bio: { type: String, default: null },        // Deprecated
    discord_link: { type: String, default: null }, // Deprecated
    instagram_username: { type: String, default: null }, // Deprecated
    is_private: { type: Boolean, default: false }, // Deprecated

    is_disabled: {
        type: Boolean,
        default: false,
    },

    // Security
    hint_question: {
        type: String,
        required: true,
    },
    hint_answer: {
        type: String,
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

// Encrypt password + sync fields pre-save
userSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }

    if (this.isModified('hint_answer')) {
        this.hint_answer = await bcrypt.hash(this.hint_answer, 10);
    }

    // Sync root fields to/from profile if needed (simple migration strategy)
    // For new users, we prioritize profile.*. For old, we might need to migrate on fetch/save.
    // Here we ensure display_name defaults to full_name if empty
    if (!this.profile.display_name && this.full_name) {
        this.profile.display_name = this.full_name;
    }

    next();
});

const User = mongoose.model('User', userSchema);

export default User;
