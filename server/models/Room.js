import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
    join_code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
    },
    owner_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['waiting', 'playing', 'finished'],
        default: 'waiting',
    },
    current_round: {
        type: Number,
        default: 1,
    },
    num_rounds: {
        type: Number,
        default: 3,
    },
    voting_time: {
        type: Number,
        default: 60,
    },
    response_time: {
        type: Number,
        default: 60,
    },
    word_difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard', 'expert', 'custom'],
        default: 'medium',
    },
    custom_words: [{
        main: String,
        imposter: String,
    }],
    game_state: {
        phase: { type: String, default: 'waiting' }, // waiting, word, response, voting, result, finished
        word_pair: {
            main: String,
            imposter: String,
        },
        imposter_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        response_order: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        current_player_index: { type: Number, default: 0 },
        responses: { type: Map, of: String, default: {} }, // userId -> response
        votes: { type: Map, of: String, default: {} }, // userId -> votedUserId
        timer_end: Date,
    },
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const Room = mongoose.model('Room', roomSchema);

export default Room;
