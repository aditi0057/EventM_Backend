import Poll from "../models/polls.model.js";
import Vote from "../models/votes.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// Create Poll
export const createPoll = asyncHandler(async (req, res) => {
  const { tab, question, startTime, endTime, options } = req.body;

  if (!tab || !question || !startTime || !endTime || !options || !options.length) {
    throw new ApiError(400, "All fields are required and options must have at least one entry");
  }

  const poll = new Poll({
    tab,
    question,
    startTime,
    endTime,
    options
  });

  await poll.save();
  return res.status(201).json(new ApiResponse(201, poll, "Poll created successfully"));
});

// Get Polls
export const getPolls = asyncHandler(async (req, res) => {
  const { tab } = req.query;
  const filters = tab ? { tab } : {};
  const polls = await Poll.find(filters);
  return res.status(200).json(new ApiResponse(200, polls, "Polls fetched successfully"));
});

// Vote on Poll
export const voteOnPoll = asyncHandler(async (req, res) => {
  const { pollId } = req.params;
  const { userId, optionIndex } = req.body;

  if (!userId || optionIndex === undefined) {
    throw new ApiError(400, "User ID and option index are required");
  }

  const poll = await Poll.findById(pollId);
  if (!poll) {
    throw new ApiError(404, "Poll not found");
  }

  if (new Date() < new Date(poll.startTime) || new Date() > new Date(poll.endTime)) {
    throw new ApiError(400, "Voting is not allowed outside the poll's active period");
  }

  const vote = new Vote({
    pollId,
    userId,
    optionIndex
  });

  await vote.save();

  poll.votes[optionIndex] = (poll.votes[optionIndex] || 0) + 1;
  await poll.save();

  return res.status(200).json(new ApiResponse(200, { message: "Vote recorded successfully" }));
});

// Get Poll Results
export const getPollResults = asyncHandler(async (req, res) => {
  const { pollId } = req.params;

  const poll = await Poll.findById(pollId);
  if (!poll) {
    throw new ApiError(404, "Poll not found");
  }

  return res.status(200).json(new ApiResponse(200, { poll, votes: poll.votes }, "Poll results fetched successfully"));
});
