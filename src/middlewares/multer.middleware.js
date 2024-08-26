import multer from 'multer';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Directory where files will be temporarily stored
    cb(null, './public/temp');
  },
  filename: (req, file, cb) => {
    // Use original file name
    cb(null, file.originalname);
  }
});

// Create multer instance with the storage configuration
const upload = multer({ storage });

export default upload;
