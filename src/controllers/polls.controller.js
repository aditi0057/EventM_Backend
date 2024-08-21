import Poll from "../models/polls.model.js";
import Vote from "../models/votes.model.js";

// Create Poll
export const createPoll = async (req, res) => {
  try {
    const { tab, question, startTime, endTime, options } = req.body;

    const poll = new Poll({
      tab,
      question,
      startTime,
      endTime,
      options
    });

    await poll.save();
    res.status(201).json({ message: "Poll created successfully", poll });
  } catch (error) {
    res.status(500).json({ message: "Error creating poll", error });
  }
};

// Get Polls
export const getPolls = async (req, res) => {
  try {
    const { tab } = req.query;
    const filters = tab ? { tab } : {};
    const polls = await Poll.find(filters);
    res.status(200).json(polls);
  } catch (error) {
    res.status(500).json({ message: "Error fetching polls", error });
  }
};

// Vote on Poll
export const voteOnPoll = async (req, res) => {
  try {
    const { pollId } = req.params;
    const { userId, optionIndex } = req.body;

    const poll = await Poll.findById(pollId);
    if (!poll) return res.status(404).json({ message: "Poll not found" });

    if (new Date() < new Date(poll.startTime) || new Date() > new Date(poll.endTime)) {
      return res.status(400).json({ message: "Voting is not allowed outside the poll's active period" });
    }

    const vote = new Vote({
      pollId,
      userId,
      optionIndex
    });

    await vote.save();

    poll.votes[optionIndex] += 1;
    await poll.save();

    res.status(200).json({ message: "Vote recorded successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error recording vote", error });
  }
};

// Get Poll Results
export const getPollResults = async (req, res) => {
  try {
    const { pollId } = req.params;

    const poll = await Poll.findById(pollId);
    if (!poll) return res.status(404).json({ message: "Poll not found" });

    res.status(200).json({ poll, votes: poll.votes });
  } catch (error) {
    res.status(500).json({ message: "Error fetching poll results", error });
  }
};
