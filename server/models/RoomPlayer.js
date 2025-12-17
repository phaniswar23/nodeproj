import mongoose from 'mongoose';

const roomPlayerSchema = new mongoose.Schema({
    room_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        required: true,
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    score: {
        type: Number,
        default: 0,
    },
    is_approved: {
        type: Boolean,
        default: true, // Auto-approve for now unless explicit "waiting room" logic changes
    },
    is_ready: {
        type: Boolean,
        default: false
    },
    joined_at: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: false // We use joined_at manually
});

// Ensure a user can only be in a room once (though they might rejoin)
roomPlayerSchema.index({ room_id: 1, user_id: 1 }, { unique: true });

const RoomPlayer = mongoose.model('RoomPlayer', roomPlayerSchema);

export default RoomPlayer;
