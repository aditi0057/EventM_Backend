// // routes/admin.routes.js

// import express from 'express';
// import adminOnly from '../middlewares/admin.middleware.js';
// import * as eventsController from '../controllers/events.controller.js';
// import * as pollsController from '../controllers/polls.controller.js';
// import * as galleryController from '../controllers/gallery.controller.js';

// const router = express.Router();

// // Event management routes
// router.post('/events', adminOnly, eventsController.createEvent);
// router.put('/events/:id', adminOnly, eventsController.updateEvent);
// router.delete('/events/:id', adminOnly, eventsController.deleteEvent);

// // Poll management routes
// router.post('/polls', adminOnly, pollsController.createPoll);
// router.get('/polls/:id/results', adminOnly, pollsController.getPollResults);
// router.put('/polls/:id/close', adminOnly, pollsController.closePoll);

// // User content management routes
// router.get('/gallery', adminOnly, galleryController.getUserGallery);
// router.put('/gallery/:id/approve', adminOnly, galleryController.approveContent);
// router.put('/gallery/:id/reject', adminOnly, galleryController.rejectContent);
// router.delete('/gallery/:id', adminOnly, galleryController.deleteContent);

// export default router;


import express from 'express';
import { createEvent, updateEvent, deleteEvent } from '../controllers/admin.controller.js';
import { adminOnly } from '../middlewares/admin.middleware.js';

const router = express.Router();

// Route to create a new event
router.post('/events', adminOnly, createEvent);

// Route to update an existing event
router.put('/events/:id', adminOnly, updateEvent);

// Route to delete an event
router.delete('/events/:id', adminOnly, deleteEvent);

export default router;
