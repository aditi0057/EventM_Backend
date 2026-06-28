import { Notification } from "../models/notification.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const getNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  await Notification.updateMany({ link: /announcements/i }, { link: null });
  const docs = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit));
  return res.status(200).json(new ApiResponse(200, { docs }, "Notifications fetched"));
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  const item = await Notification.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, { read: true, isRead: true }, { new: true });
  return res.status(200).json(new ApiResponse(200, item, "Notification marked read"));
});

export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ userId: req.user._id }, { read: true, isRead: true });
  return res.status(200).json(new ApiResponse(200, {}, "Notifications marked read"));
});

export const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({ userId: req.user._id, isRead: { $ne: true }, read: { $ne: true } });
  return res.status(200).json(new ApiResponse(200, { count }, "Unread count fetched"));
});
