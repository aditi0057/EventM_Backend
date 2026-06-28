// models/gallery.model.js

import mongoose from 'mongoose';

const { Schema } = mongoose;
import mongoosePaginate from 'mongoose-paginate-v2';
const galleryAlbumSchema = new Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: "", trim: true },
  eventId: { type: Schema.Types.ObjectId, ref: "Event", required: false },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

const gallerySchema = new Schema({
  image_url: {
    type: String,
    required: true,
    trim: true
  },
  event_id: {
    type: Schema.Types.ObjectId,
    ref: 'Event',
    required: false
  },
  uploaded_by: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  isApproved: {
        type: Boolean,
        default: false
    },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    index: true
  },
  albumId: {
    type: Schema.Types.ObjectId,
    ref: 'GalleryAlbum',
    required: false
  },
  caption: {
    type: String,
    default: "",
    maxlength: 120
  },
  likes: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true 
});

gallerySchema.plugin(mongoosePaginate);

export const Gallery = mongoose.model('Gallery', gallerySchema);
export const GalleryAlbum = mongoose.model('GalleryAlbum', galleryAlbumSchema);

