import { Router } from 'express';
import {
    createPoll,
    getPolls,
    voteOnPoll,
    getPollResults,
    closePoll,
} from '../controllers/polls.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/role.middleware.js';

const router = Router();
router.use(verifyJWT);

router.route('/')
    .get(getPolls) 
    .post(authorizeRoles('admin'), createPoll); 

router.route('/:pollId/vote').post(voteOnPoll); 
router.route('/:pollId/results').get(getPollResults); 
router.route('/:pollId/close').patch(authorizeRoles('admin'), closePoll);

export default router;