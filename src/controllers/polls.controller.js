import { Poll } from "../models/polls.model.js";
import { Vote } from "../models/votes.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";

export const createPoll = asyncHandler(async (req, res) => {
    const { tab, question, start_time, end_time, options } = req.body;

    if (!tab || !question || !start_time || !end_time || !options || !Array.isArray(options) || options.length < 2) {
        throw new ApiError(400, "All fields are required, and there must be at least two options");
    }

    if (new Date(start_time) >= new Date(end_time)) {
        throw new ApiError(400, "End time must be after the start time");
    }

    const poll = await Poll.create({
        tab,
        question,
        start_time,
        end_time,
        options,
    });

    return res.status(201).json(new ApiResponse(201, poll, "Poll created successfully"));
});


export const getPolls = asyncHandler(async (req, res) => {
    const { tab } = req.query;
    const filters = tab ? { tab } : {};
    const polls = await Poll.find(filters).sort({ createdAt: -1 });

    return res.status(200).json(new ApiResponse(200, polls, "Polls fetched successfully"));
});

export const voteOnPoll = asyncHandler(async (req, res) => {
    const { pollId } = req.params;
    const { optionIndex } = req.body;
    const userId = req.user._id; 

    if (optionIndex === undefined || typeof optionIndex !== 'number') {
        throw new ApiError(400, "A valid option index is required to vote");
    }

    const poll = await Poll.findById(pollId);
    if (!poll) {
        throw new ApiError(404, "Poll not found");
    }

    if (new Date() < new Date(poll.start_time) || new Date() > new Date(poll.end_time)) {
        throw new ApiError(403, "This poll is not currently active for voting");
    }

    if (optionIndex < 0 || optionIndex >= poll.options.length) {
        throw new ApiError(400, "Invalid option index provided");
    }

    try {
        await Vote.create({
            poll_id: pollId,
            user_id: userId,
            option_index: optionIndex,
        });
    } catch (error) {
        if (error.code === 11000) {
            throw new ApiError(409, "You have already voted on this poll");
        }
        throw error; 
    }

    return res.status(200).json(new ApiResponse(200, {}, "Your vote has been recorded successfully"));
});
export const closePoll = asyncHandler(async (req, res) => {
    const { pollId } = req.params;
    const poll = await Poll.findByIdAndUpdate(pollId, { isActive: false }, { new: true });
    
    if (!poll) {
        throw new ApiError(404, "Poll not found");
    }

    return res.status(200).json(new ApiResponse(200, poll, "Poll has been closed"));
});

export const getPollResults = asyncHandler(async (req, res) => {
    const { pollId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(pollId)) {
        throw new ApiError(400, "Invalid poll ID format");
    }

    const poll = await Poll.findById(pollId);
    if (!poll) {
        throw new ApiError(404, "Poll not found");
    }

    const results = await Vote.aggregate([
        {
            $match: { poll_id: new mongoose.Types.ObjectId(pollId) }
        },
        {
            $group: {
                _id: "$option_index", 
                count: { $sum: 1 }     
            }
        },
        {
            $sort: { _id: 1 } 
        }
    ]);

    const formattedResults = {
        poll: poll,
        results: poll.options.map((option, index) => {
            const result = results.find(r => r._id === index);
            return {
                option: option,
                count: result ? result.count : 0
            };
        }),
        totalVotes: results.reduce((sum, r) => sum + r.count, 0)
    };

    return res.status(200).json(new ApiResponse(200, formattedResults, "Poll results fetched successfully"));
});