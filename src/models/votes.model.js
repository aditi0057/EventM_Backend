import mongoose, { Schema } from "mongoose";

const voteSchema = new Schema({
    poll_id: {
        type: Schema.Types.ObjectId,
        ref: 'Poll',
        required: true
    },
    user_id: {
        type: Schema.Types.ObjectId,
        ref: 'User', // Reference to the User model
        required: true
    },
    option_index: {
        type: Number,
        required: true
    },
    created_at: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

export const Vote = mongoose.model("Vote", voteSchema);
