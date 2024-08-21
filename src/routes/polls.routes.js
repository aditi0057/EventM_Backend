import express from "express";
import { createPoll, getPolls, voteOnPoll, getPollResults } from "../controllers/polls.controller.js";

const router = express.Router();

router.post("/", createPoll);
router.get("/", getPolls);
router.post("/:pollId/vote", voteOnPoll);
router.get("/:pollId/results", getPollResults);


export default router;
