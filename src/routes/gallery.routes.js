import { Router } from 'express';
import { upload } from '../middlewares/multer.middleware.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/role.middleware.js'; 
import {
    uploadImage,
    deleteImage,
    getAllImages,
    getImagesByEvent,
    getImagesByUser,
    approveImage,
    rejectImage,
    getPendingImages,
    approveAllImages,
    createAlbum,
    getAlbums,
    debugGallery
} from '../controllers/gallery.controller.js';

const router = Router();
router.use(verifyJWT);

router.route('/')
    .get(getAllImages)
    .post(upload.fields([{ name: 'image', maxCount: 1 }, { name: 'file', maxCount: 1 }]), (req, res, next) => {
        req.file = req.files?.image?.[0] || req.files?.file?.[0];
        next();
    }, uploadImage); 

router.route('/upload').post(upload.fields([{ name: 'image', maxCount: 1 }, { name: 'file', maxCount: 1 }]), (req, res, next) => {
    req.file = req.files?.image?.[0] || req.files?.file?.[0];
    next();
}, uploadImage);
router.route('/albums').get(getAlbums).post(authorizeRoles('admin'), createAlbum);

router.route('/event/:eventId').get(getImagesByEvent);
router.route('/user/:userId').get(getImagesByUser);
router.route('/pending').get(authorizeRoles('admin'), getPendingImages);
router.route('/approve-all').post(authorizeRoles('admin'), approveAllImages);
router.route('/debug').get(authorizeRoles('admin'), debugGallery);

router.route('/:imageId').delete(deleteImage);
router.route('/:imageId/approve').patch(authorizeRoles('admin'), approveImage);
router.route('/:imageId/reject').patch(authorizeRoles('admin'), rejectImage).delete(authorizeRoles('admin'), rejectImage);

export default router;
