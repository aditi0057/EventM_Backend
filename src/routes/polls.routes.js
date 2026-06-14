import { Router } from 'express';
import {
    createPoll,
    getPolls,
    voteOnPoll,
    getPollResults,
    closePoll,
    deletePoll,
    updatePoll,
} from '../controllers/polls.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/role.middleware.js';

const router = Router();
router.use(verifyJWT);

router.route('/')
    .get(getPolls) 
    .post(createPoll); 

router.route('/:pollId/vote').post(voteOnPoll).patch(voteOnPoll); 
router.route('/:pollId/results').get(getPollResults); 
router.route('/:pollId/close').patch(closePoll);
router.route('/:pollId').patch(updatePoll).delete(deletePoll);

export default router;
