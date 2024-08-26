// models/gallery.model.js

import mongoose from 'mongoose';

const { Schema } = mongoose;

const gallerySchema = new Schema({
  image_url: {
    type: String,
    required: true,
    trim: true
  },
  event_id: {
    type: Schema.Types.ObjectId,
    ref: 'Event', // Reference to Event model if you have it
    required: true
  },
  uploaded_by: {
    type: Schema.Types.ObjectId,
    ref: 'User', // Reference to User model
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

const Gallery = mongoose.model('Gallery', gallerySchema);

export { Gallery };
