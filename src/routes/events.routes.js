// import express from 'express';
// import Event from '../models/eventModel.js';  // Import the Event model

// const router = express.Router();

// // Create an event
// router.post('/', async (req, res) => {
//     try {
//         const { title, type, host, date, created_by } = req.body;
//         const newEvent = new Event({ title, type, host, date, created_by });
//         await newEvent.save();
//         res.status(201).json(newEvent);
//     } catch (err) {
//         res.status(400).json({ error: err.message });
//     }
// });

// // Get all events
// router.get('/', async (req, res) => {
//     try {
//         const events = await Event.find();
//         res.status(200).json(events);
//     } catch (err) {
//         res.status(400).json({ error: err.message });
//     }
// });

// // Add more routes as needed...

// export default router;



import { Router } from 'express';
import { createEvent, getEvents, getEventById, updateEvent, deleteEvent } from '../controllers/events.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/role.middleware.js'; // Import role middleware

const router = Router();

// Public route for getting events
router.route('/')
    .get(getEvents)
    .post(verifyJWT, authorizeRoles('admin'), createEvent); // Only admins can create events

// Routes requiring specific event ID
router.route('/:eventId')
    .get(getEventById)
    .put(verifyJWT, authorizeRoles('admin'), updateEvent) // Only admins can update events
    .delete(verifyJWT, authorizeRoles('admin'), deleteEvent); // Only admins can delete events

export default router;

