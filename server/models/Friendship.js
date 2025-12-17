import mongoose from 'mongoose';

const friendshipSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    friend_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Ensure uniqueness (usually we store two rows or one row with normalized IDs)
// For simplicity matching Supabase likely pattern: bidirectional might mean two rows?
// But logic can handle it. Uniqueness here:
friendshipSchema.index({ user_id: 1, friend_id: 1 }, { unique: true });

const Friendship = mongoose.model('Friendship', friendshipSchema);

export default Friendship;
