

import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/role.middleware.js';
import { getUserDashboardData } from '../controllers/userdashboard.controller.js'; // Assuming you moved this
import { getAdminDashboardData } from '../controllers/admindashboard.controller.js';

const router = Router();

router.route('/user').get(verifyJWT, getUserDashboardData);

router.route('/admin').get(verifyJWT, authorizeRoles('admin'), getAdminDashboardData);

export default router;