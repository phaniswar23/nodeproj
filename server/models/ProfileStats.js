import mongoose from 'mongoose';

const profileStatsSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
    wins: {
        type: Number,
        default: 0,
    },
    losses: {
        type: Number,
        default: 0,
    },
    rooms_participated: {
        type: Number,
        default: 0,
    },
    total_score: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const ProfileStats = mongoose.model('ProfileStats', profileStatsSchema);

export default ProfileStats;
