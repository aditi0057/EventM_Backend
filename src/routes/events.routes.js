import { Router } from 'express';
import {
    createEvent,
    getEvents,
    getEventById,
    updateEvent,
    deleteEvent,
    rsvpEvent,
    getRsvps,
} from '../controllers/events.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.route('/')
    .get(verifyJWT, getEvents)
    .post(verifyJWT, createEvent); 

router.route('/:eventId')
    .get(verifyJWT, getEventById) 
    .put(verifyJWT, updateEvent)
    .patch(verifyJWT, updateEvent)
    .delete(verifyJWT, deleteEvent);

router.route('/:eventId/rsvp')
    .get(verifyJWT, getRsvps)
    .post(verifyJWT, rsvpEvent);
export default router;
