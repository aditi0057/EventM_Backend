import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Event } from "../models/event.model.js";
import { Poll } from "../models/poll.model.js";
import { Gallery } from "../models/gallery.model.js";

// Event Management

// Create a new event
const createEvent = asyncHandler(async (req, res) => {
  const event = new Event(req.body);
  await event.save();
  res.status(201).json(new ApiResponse(201, event, "Event created successfully"));
});

// Update an existing event
const updateEvent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const event = await Event.findByIdAndUpdate(id, req.body, { new: true });
  if (!event) {
    throw new ApiError(404, "Event not found");
  }
  res.status(200).json(new ApiResponse(200, event, "Event updated successfully"));
});

// Delete an event
const deleteEvent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const event = await Event.findByIdAndDelete(id);
  if (!event) {
    throw new ApiError(404, "Event not found");
  }
  res.status(200).json(new ApiResponse(200, null, "Event deleted successfully"));
});

// Poll Management

// Create a new poll
const createPoll = asyncHandler(async (req, res) => {
  const poll = new Poll(req.body);
  await poll.save();
  res.status(201).json(new ApiResponse(201, poll, "Poll created successfully"));
});

// Update an existing poll
const updatePoll = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const poll = await Poll.findByIdAndUpdate(id, req.body, { new: true });
  if (!poll) {
    throw new ApiError(404, "Poll not found");
  }
  res.status(200).json(new ApiResponse(200, poll, "Poll updated successfully"));
});

// Close a poll
const closePoll = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const poll = await Poll.findByIdAndUpdate(id, { isActive: false }, { new: true });
  if (!poll) {
    throw new ApiError(404, "Poll not found");
  }
  res.status(200).json(new ApiResponse(200, poll, "Poll closed successfully"));
});

// Gallery Management

// Approve gallery contribution
const approveGalleryContribution = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const galleryItem = await Gallery.findByIdAndUpdate(id, { isApproved: true }, { new: true });
  if (!galleryItem) {
    throw new ApiError(404, "Gallery item not found");
  }
  res.status(200).json(new ApiResponse(200, galleryItem, "Gallery item approved successfully"));
});

// Reject gallery contribution
const rejectGalleryContribution = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const galleryItem = await Gallery.findByIdAndDelete(id);
  if (!galleryItem) {
    throw new ApiError(404, "Gallery item not found");
  }
  res.status(200).json(new ApiResponse(200, null, "Gallery item rejected successfully"));
});

// Export controllers
export {
  createEvent,
  updateEvent,
  deleteEvent,
  createPoll,
  updatePoll,
  closePoll,
  approveGalleryContribution,
  rejectGalleryContribution
};
