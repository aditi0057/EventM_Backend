

import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/role.middleware.js';
import { getUserDashboardData } from '../controllers/userdashboard.controller.js'; // Assuming you moved this
import { getAdminDashboardData, getAdminStats, getAdminUsers, updateAdminUserRole, updateAdminUserStatus } from '../controllers/admindashboard.controller.js';

const router = Router();

router.route('/user').get(verifyJWT, getUserDashboardData);

router.route('/admin').get(verifyJWT, authorizeRoles('admin'), getAdminDashboardData);
router.route('/stats').get(verifyJWT, authorizeRoles('admin'), getAdminStats);
router.route('/users').get(verifyJWT, authorizeRoles('admin'), getAdminUsers);
router.route('/users/:id/role').patch(verifyJWT, authorizeRoles('admin'), updateAdminUserRole);
router.route('/users/:id/status').patch(verifyJWT, authorizeRoles('admin'), updateAdminUserStatus);

export default router;
