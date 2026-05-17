import multer from 'multer';
import fs from 'fs';

const tempDir = './public/temp';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdirSync(tempDir, { recursive: true });
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now(); 
    cb(null,`${uniqueSuffix}-${file.originalname}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith('image/')) {
    const error = new Error('Only image uploads are allowed');
    error.statusCode = 400;
    return cb(error);
  }
  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

