import mongoose, { Schema } from "mongoose";

const voteSchema = new Schema({
    poll_id: {
        type: Schema.Types.ObjectId,
        ref: 'Poll',
        required: true
    },
    user_id: {
        type: Schema.Types.ObjectId,
        ref: 'User', 
        required: true
    },
    option_index: {
        type: Number,
        required: true
    },

}, {
    timestamps: true
});

voteSchema.index({poll_id: 1, user_id: 1},{unique: true});

export const Vote = mongoose.model("Vote", voteSchema);
