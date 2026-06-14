import { Announcement } from "../models/announcement.model.js";
import { Notification } from "../models/notification.model.js";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const getAnnouncements = asyncHandler(async (req, res) => {
  const docs = await Announcement.find().sort({ createdAt: -1 }).limit(20);
  return res.status(200).json(new ApiResponse(200, { docs }, "Announcements fetched"));
});

export const createAnnouncement = asyncHandler(async (req, res) => {
  if (req.user.role !== "admin") throw new ApiError(403, "Access denied");
  const body = req.body.body || req.body.message;
  const sendTo = req.body.sendTo || req.body.audience || "All users";
  const priority = req.body.priority || "Normal";
  const scheduledFor = req.body.scheduledFor || req.body.scheduledAt;
  if (!body || body.trim().length < 10) throw new ApiError(400, "Announcement must be at least 10 characters");
  const announcement = await Announcement.create({ body, sendTo, priority, scheduledFor, createdBy: req.user._id });
  const users = await User.find().select("_id");
  await Notification.insertMany(users.map((user) => ({ userId: user._id, type: "announcement", message: `Announcement: ${body.slice(0, 80)}`, link: "/announcements" })));
  return res.status(201).json(new ApiResponse(201, announcement, "Announcement created"));
});

export const deleteAnnouncement = asyncHandler(async (req, res) => {
  if (req.user.role !== "admin") throw new ApiError(403, "Access denied");
  await Announcement.findByIdAndDelete(req.params.id);
  return res.status(200).json(new ApiResponse(200, {}, "Announcement deleted"));
});
