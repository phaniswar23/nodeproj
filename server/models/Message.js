import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        // required: true, // Made optional for room chat
    },
    room_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
    },
    content: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ['user', 'system'],
        default: 'user'
    },
    read: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true
});

const Message = mongoose.model('Message', messageSchema);

export default Message;
