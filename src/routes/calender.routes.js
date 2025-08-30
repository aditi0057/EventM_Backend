
import { Router } from 'express';
import { getPersonalCalendarEvents, getCompanyCalendarEvents } from '../controllers/calender.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.route('/personal').get(verifyJWT, getPersonalCalendarEvents);

router.route('/company').get(verifyJWT, getCompanyCalendarEvents);

export default router;
