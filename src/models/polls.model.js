import mongoose, { Schema } from "mongoose";

const pollSchema = new Schema({
    tab: {
        type: String,
        enum: ['Venue', 'Schedule', 'Food', 'Others'],
        required: true
    },
    question: {
        type: String,
        required: true
    },
    start_time: {
        type: Date,
        required: true
    },
    end_time: {
        type: Date,
        required: true
    },
    options: {
        type: [String],
        required: true
    },
     isActive: {
        type: Boolean,
        default: true
    },
     participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
     creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
     },
     allowMultipleVotes: {
        type: Boolean,
        default: false
     },

}, {
    timestamps: true
});

export const Poll = mongoose.model("Poll", pollSchema);

