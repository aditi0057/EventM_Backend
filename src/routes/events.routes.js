import { Router } from 'express';
import {
    createEvent,
    getEvents,
    getEventById,
    updateEvent,
    deleteEvent,
} from '../controllers/events.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/role.middleware.js';

const router = Router();

router.route('/')
    .get(verifyJWT, getEvents)
    .post(verifyJWT, authorizeRoles('admin'), createEvent); 

router.route('/:eventId')
    .get(verifyJWT, getEventById) 
    .put(verifyJWT, authorizeRoles('admin'), updateEvent) 
    .delete(verifyJWT, authorizeRoles('admin'), deleteEvent); 
export default router;