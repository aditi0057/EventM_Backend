// const mongoose = require('mongoose');
// const { Schema } = mongoose;
import mongoose, { Schema } from "mongoose";

// Define the Event schema
const eventSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    type: {
        type: String, // 'Birthday', 'Anniversary', etc.
        required: true
    },
    host: {
        type: String, // Host's name
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the User model
        default: null
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
});

// Middleware to update 'updated_at' on save
eventSchema.pre('save', function(next) {
    this.updated_at = Date.now();
    next();
});

// Create the Event model
const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
