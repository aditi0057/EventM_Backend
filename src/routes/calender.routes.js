import { Router } from 'express';
import { getCalendarEvents } from '../controllers/calendar.controller.js';

const router = Router();

// Public route to get calendar events
router.get('/calender', getCalendarEvents);

export default router;
