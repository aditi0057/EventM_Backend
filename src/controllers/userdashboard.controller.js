import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { Event } from "../models/event.model.js";
import { Poll } from "../models/poll.model.js";
import { Gallery } from "../models/gallery.model.js";

// Fetch user details
const getUserDetails = asyncHandler(async (userId) => {
  const user = await User.findById(userId).select('-password -refreshToken');
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  return user;
});

// Fetch upcoming events
const getUpcomingEvents = asyncHandler(async (userId) => {
  const now = new Date();
  const events = await Event.find({
    $or: [
      { attendees: userId },
      { isPublic: true }
    ],
    date: { $gte: now }
  });
  return events;
});

// Fetch active polls
const getActivePolls = asyncHandler(async (userId) => {
  const polls = await Poll.find({
    $or: [
      { participants: userId },
      { isActive: true }
    ]
  });
  return polls;
});

// Fetch gallery contributions
const getGalleryContributions = asyncHandler(async (userId) => {
  const galleryContributions = await Gallery.find({ uploadedBy: userId });
  return galleryContributions;
});

// Aggregate all data for the dashboard
const getUserDashboardData = asyncHandler(async (req, res) => {
  const userId = req.user._id; // Extract user ID from request object

  // Fetch all necessary data
  const userDetails = await getUserDetails(userId);
  const upcomingEvents = await getUpcomingEvents(userId);
  const activePolls = await getActivePolls(userId);
  const galleryContributions = await getGalleryContributions(userId);

  // Aggregate data
  const dashboardData = {
    userDetails,
    upcomingEvents,
    activePolls,
    galleryContributions
  };

  // Send response
  res.status(200).json(new ApiResponse(200, dashboardData, "Dashboard data fetched successfully"));
});

export { getUserDashboardData };
