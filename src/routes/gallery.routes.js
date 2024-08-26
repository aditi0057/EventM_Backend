// routes/gallery.routes.js
import { Router } from 'express';
import upload from '../middlewares/multer.middleware.js'; // Import the upload middleware
import { uploadImage, deleteImage, getAllImages, getImagesByEvent, getImagesByUser, updateImage } from '../controllers/gallery.controller.js'; // Import controller functions
import { verifyJWT } from '../middlewares/auth.middleware.js'; // Import JWT verification middleware

const router = Router();

// Route to handle image uploads
router.post('/upload', verifyJWT, upload.single('image'), uploadImage);

// Route to delete an image
router.delete('/delete/:id', verifyJWT, deleteImage);

// Route to update an image
router.put('/update/:id', verifyJWT, updateImage);

// Route to get all images
router.get('/', getAllImages);

// Route to get images by event
router.get('/event/:eventId', getImagesByEvent);

// Route to get images by user
router.get('/user/:userId', getImagesByUser);

export default router;
