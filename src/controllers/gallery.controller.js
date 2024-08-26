// // controllers/gallery.controller.js
// import cloudinary from 'cloudinary';
// import { Gallery } from '../models/gallery.model.js'; // Import Gallery model
// import User from '../models/user.model.js'; // Import User model, if needed for validation

// // Initialize Cloudinary
// cloudinary.v2.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// export const uploadImage = async (req, res) => {
//   try {
//     const { event_id } = req.body; // Extract event ID from request body
//     const file = req.file; // The file object should be available in req.file (use multer or similar middleware)

//     if (!file || !event_id) {
//       return res.status(400).json({ error: 'Image file and event ID are required.' });
//     }

//     // Upload image to Cloudinary
//     const result = await cloudinary.v2.uploader.upload(file.path, {
//       folder: 'gallery', // Optional: Cloudinary folder for organization
//       use_filename: true,
//       unique_filename: true
//     });

//     // Create new gallery entry
//     const newImage = new Gallery({
//       image_url: result.secure_url,
//       event_id,
//       uploaded_by: req.user._id, // Ensure req.user._id is set by authentication middleware
//       created_at: new Date()
//     });

//     // Save image details to database
//     await newImage.save();

//     res.status(201).json({ message: 'Image uploaded successfully.', image: newImage });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Failed to upload image.' });
//   }
// };

import cloudinary from 'cloudinary';
import fs from 'fs';
import { Gallery } from '../models/gallery.model.js'; // Import Gallery model
import User from '../models/user.model.js'; // Import User model for user validation

// Initialize Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Controller to handle image uploads
export const uploadImage = async (req, res) => {
  try {
    const { event_id } = req.body; // Extract event ID from request body
    const file = req.file; // The file object should be available in req.file (use multer or similar middleware)

    if (!file || !event_id) {
      return res.status(400).json({ error: 'Image file and event ID are required.' });
    }

    // Upload image to Cloudinary
    const result = await cloudinary.v2.uploader.upload(file.path, {
      folder: 'gallery', // Optional: Cloudinary folder for organization
      use_filename: true,
      unique_filename: true
    });

    // Create new gallery entry
    const newImage = new Gallery({
      image_url: result.secure_url,
      event_id,
      uploaded_by: req.user._id, // Ensure req.user._id is set by authentication middleware
      created_at: new Date()
    });

    // Save image details to database
    await newImage.save();

    // Remove the file from the local temp directory
    fs.unlinkSync(file.path);

    res.status(201).json({ message: 'Image uploaded successfully.', image: newImage });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to upload image.' });
  }
};

// Controller to handle image deletion
export const deleteImage = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the image in the database
    const image = await Gallery.findById(id);

    if (!image) {
      return res.status(404).json({ message: 'Image not found.' });
    }

    // Extract the public ID from the image URL
    const publicId = image.image_url.split('/').pop().split('.')[0];

    // Delete the image from Cloudinary
    await cloudinary.v2.uploader.destroy(publicId);

    // Remove the image record from the database
    await Gallery.findByIdAndDelete(id);

    res.status(200).json({ message: 'Image deleted successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete image.' });
  }
};

// Controller to get all images with optional pagination
export const getAllImages = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query; // Pagination parameters
    const skip = (page - 1) * limit;

    const images = await Gallery.find()
      .skip(skip)
      .limit(parseInt(limit))
      .populate('event_id', 'name date') // Populate event data
      .populate('uploaded_by', 'username') // Populate user data
      .exec();

    const total = await Gallery.countDocuments(); // Total number of images

    res.status(200).json({
      total,
      page,
      limit,
      images
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve images', error });
  }
};

// Controller to get images by event ID
export const getImagesByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const images = await Gallery.find({ event_id: eventId })
      .populate('event_id', 'name date') // Populate event data
      .populate('uploaded_by', 'username') // Populate user data
      .exec();

    if (!images.length) {
      return res.status(404).json({ message: 'No images found for this event' });
    }

    res.status(200).json(images);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve images', error });
  }
};

// Controller to get images by user ID
export const getImagesByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const images = await Gallery.find({ uploaded_by: userId })
      .populate('event_id', 'name date') // Populate event data
      .populate('uploaded_by', 'username') // Populate user data
      .exec();

    if (!images.length) {
      return res.status(404).json({ message: 'No images found for this user' });
    }

    res.status(200).json(images);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve images', error });
  }
};
// Controller to handle image updates
export const updateImage = async (req, res) => {
    try {
      const { id } = req.params; // Image ID from request params
      const { event_id } = req.body; // New event ID from request body
  
      // Find the image in the database
      const image = await Gallery.findById(id);
  
      if (!image) {
        return res.status(404).json({ message: 'Image not found.' });
      }
  
      // Update image metadata
      if (event_id) {
        image.event_id = event_id;
      }
  
      // Save updated image details to database
      await image.save();
  
      res.status(200).json({ message: 'Image updated successfully.', image });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to update image.' });
    }
  };