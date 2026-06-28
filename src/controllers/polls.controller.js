import { Poll } from "../models/polls.model.js";
import { Vote } from "../models/votes.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";
import { notifyAllUsers } from "../utils/notifications.js";

const activePollFilter = (now = new Date()) => ({
    isActive: true,
    end_time: { $gt: now },
});

export const createPoll = asyncHandler(async (req, res) => {
    const { tab, question, start_time, end_time, options, allowMultipleVotes } = req.body;

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
        creator: req.user._id,
        allowMultipleVotes: Boolean(allowMultipleVotes),
    });
    await notifyAllUsers({
        type: "poll",
        title: "New poll",
        message: `New poll: ${poll.question}`,
        link: "/Poll",
    });

    return res.status(201).json(new ApiResponse(201, poll, "Poll created successfully"));
});


export const getPolls = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const now = new Date();

    const polls = await Poll.aggregate([
        { $match: { start_time: { $lte: now } } },
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
            $addFields: {
                isActive: {
                    $and: [
                        "$isActive",
                        { $gt: ["$end_time", now] }
                    ]
                },
                userVoteIndex: {
                    $let: {
                        vars: {
                            ownVote: {
                                $first: {
                                    $filter: {
                                        input: "$allVotes",
                                        as: "vote",
                                        cond: { $eq: ["$$vote.user_id", userId] }
                                    }
                                }
                            }
                        },
                        in: "$$ownVote.option_index"
                    }
                }
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
        await Vote.findOneAndUpdate({
            poll_id: pollId,
            user_id: userId,
        }, {
            poll_id: pollId,
            user_id: userId,
            option_index: optionIndex,
        }, { upsert: true, new: true, setDefaultsOnInsert: true });
        
        return res.status(200).json(new ApiResponse(200, {}, "Your vote has been recorded successfully"));

    } catch (error) {
        throw error;
    }
});

export const updatePoll = asyncHandler(async (req, res) => {
    const { pollId } = req.params;
    const poll = await Poll.findById(pollId);

    if (!poll) {
        throw new ApiError(404, "Poll not found");
    }

    if (req.user.role !== "admin" && poll.creator?.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Access denied");
    }

    const question = req.body.question?.trim();
    const tab = req.body.tab || req.body.category;
    const options = Array.isArray(req.body.options)
        ? req.body.options.map((option) => String(option).trim()).filter(Boolean)
        : [];
    const endTime = req.body.end_time || req.body.deadline;
    const allowMultipleVotes = req.body.allowMultipleVotes ?? req.body.allowMultiple;

    if (!question) {
        throw new ApiError(400, "Question is required");
    }
    if (!["Venue", "Schedule", "Food", "Others"].includes(tab)) {
        throw new ApiError(400, "Invalid poll category");
    }
    if (options.length < 2) {
        throw new ApiError(400, "At least two options are required");
    }

    const parsedEndTime = endTime ? new Date(endTime) : poll.end_time;
    if (Number.isNaN(parsedEndTime.getTime())) {
        throw new ApiError(400, "Invalid voting deadline");
    }

    poll.question = question;
    poll.tab = tab;
    poll.options = options;
    poll.end_time = parsedEndTime;
    poll.allowMultipleVotes = Boolean(allowMultipleVotes);
    await poll.save();

    return res.status(200).json(new ApiResponse(200, poll, "Poll updated successfully"));
});

export const deletePoll = asyncHandler(async (req, res) => {
    const poll = await Poll.findById(req.params.pollId);
    if (!poll) throw new ApiError(404, "Poll not found");
    if (req.user.role !== "admin" && poll.creator?.toString() !== req.user._id.toString()) throw new ApiError(403, "Access denied");
    await Vote.deleteMany({ poll_id: poll._id });
    await Poll.findByIdAndDelete(poll._id);
    return res.status(200).json(new ApiResponse(200, {}, "Poll deleted"));
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

export { activePollFilter };

