import mongoose, { Schema } from "mongoose";

const pollSchema = new Schema({
    tab: {
        type: String,
        enum: ['Venue', 'Schedule', 'Others'],
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
    votes: {
        type: [Number],
        required: true
    }
}, {
    timestamps: true
});

export const Poll = mongoose.model("Poll", pollSchema);
