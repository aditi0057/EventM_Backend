

import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/role.middleware.js';
import { getUserDashboardData } from '../controllers/userdashboard.controller.js'; // Assuming you moved this
import { getAdminDashboardData, getAdminStats, getAdminUsers, updateAdminUserRole, updateAdminUserStatus, deleteAdminUser, getAdminUserActivity, getAdminSettings, updateAdminSettings } from '../controllers/admindashboard.controller.js';
import { approveAllImages, approveImage, debugGallery, getPendingImages, rejectImage } from '../controllers/gallery.controller.js';

const router = Router();

router.route('/user').get(verifyJWT, getUserDashboardData);

router.route('/admin').get(verifyJWT, authorizeRoles('admin'), getAdminDashboardData);
router.route('/stats').get(verifyJWT, authorizeRoles('admin'), getAdminStats);
router.route('/users').get(verifyJWT, authorizeRoles('admin'), getAdminUsers);
router.route('/users/:id/activity').get(verifyJWT, authorizeRoles('admin'), getAdminUserActivity);
router.route('/users/:id/role').patch(verifyJWT, authorizeRoles('admin'), updateAdminUserRole);
router.route('/users/:id/status').patch(verifyJWT, authorizeRoles('admin'), updateAdminUserStatus);
router.route('/users/:id').delete(verifyJWT, authorizeRoles('admin'), deleteAdminUser);
router.route('/settings').get(verifyJWT, authorizeRoles('admin'), getAdminSettings).post(verifyJWT, authorizeRoles('admin'), updateAdminSettings);
router.route('/gallery/pending').get(verifyJWT, authorizeRoles('admin'), getPendingImages);
router.route('/gallery/approve-all').post(verifyJWT, authorizeRoles('admin'), approveAllImages);
router.route('/gallery/debug').get(verifyJWT, authorizeRoles('admin'), debugGallery);
router.route('/gallery/:imageId/approve').patch(verifyJWT, authorizeRoles('admin'), approveImage);
router.route('/gallery/:imageId/reject').patch(verifyJWT, authorizeRoles('admin'), rejectImage);

export default router;
