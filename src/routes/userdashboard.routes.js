import express from 'express';
import { getUserDashboardData } from '../controllers/user.controller.js';
import authenticateUser from '../middlewares/auth.middleware.js';

const router = express.Router();


router.get('/dashboard', authenticateUser, getUserDashboardData);

export default router;
