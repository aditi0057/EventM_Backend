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
    rejectImage
} from '../controllers/gallery.controller.js';

const router = Router();
router.use(verifyJWT);

router.route('/')
    .get(getAllImages)
    .post(upload.single('image'), uploadImage); 

router.route('/event/:eventId').get(getImagesByEvent);
router.route('/user/:userId').get(getImagesByUser);

router.route('/:imageId').delete(deleteImage);
router.route('/:imageId/approve').patch(authorizeRoles('admin'), approveImage);
router.route('/:imageId/reject').delete(authorizeRoles('admin'), rejectImage);

export default router;