// models/gallery.model.js

import mongoose from 'mongoose';

const { Schema } = mongoose;
import mongoosePaginate from 'mongoose-paginate-v2';
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

