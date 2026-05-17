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
    const userId = req.user._id;
    const now = new Date();

    const polls = await Poll.aggregate([
        { $match: { isActive: true, start_time: { $lte: now }, end_time: { $gte: now } } },
        { $sort: { createdAt: -1 } },
        {
            $lookup: {
                from: "votes",
                localField: "_id",
                foreignField: "poll_id",
                as: "allVotes"
            }
        },
        {
            $addFields: {
                userHasVoted: {
                    $in: [userId, "$allVotes.user_id"]
                },
                results: {
                    $reduce: {
                        input: "$options",
                        initialValue: [],
                        in: {
                            $concatArrays: [
                                "$$value",
                                [{
                                    option: "$$this",
                                    count: {
                                        $size: {
                                            $filter: {
                                                input: "$allVotes",
                                                as: "vote",
                                                cond: { $eq: ["$$vote.option_index", { $indexOfArray: ["$options", "$$this"] }] }
                                            }
                                        }
                                    }
                                }]
                            ]
                        }
                    }
                },
                totalVotes: { $size: "$allVotes" }
            }
        },
        {
            $project: {
                allVotes: 0
            }
        }
    ]);

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
    if (!poll) { throw new ApiError(404, "Poll not found"); }

    const now = new Date();
    if (now < new Date(poll.start_time) || now > new Date(poll.end_time) || !poll.isActive) {
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
        
        return res.status(200).json(new ApiResponse(200, {}, "Your vote has been recorded successfully"));

    } catch (error) {
        if (error.code === 11000) {
            throw new ApiError(409, "You have already voted on this poll");
        }
        throw error;
    }
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


export const closePoll = asyncHandler(async (req, res) => {
    const { pollId } = req.params;
    const poll = await Poll.findByIdAndUpdate(pollId, { isActive: false }, { new: true });
    
    if (!poll) {
        throw new ApiError(404, "Poll not found");
    }

    return res.status(200).json(new ApiResponse(200, poll, "Poll has been closed"));
});

