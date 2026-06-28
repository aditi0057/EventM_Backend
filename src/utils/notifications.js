import { Notification } from "../models/notification.model.js";
import { User } from "../models/user.model.js";

export const notifyUsers = async (userIds, payload) => {
  const ids = [...new Set((userIds || []).map((id) => id?.toString()).filter(Boolean))];
  if (!ids.length) return;
  await Notification.insertMany(ids.map((userId) => ({
    userId,
    type: payload.type,
    title: payload.title || "",
    message: payload.message,
    link: payload.link ?? null,
    isRead: false,
    read: false,
  })));
};

export const notifyAllUsers = async (payload) => {
  const users = await User.find({ isActive: { $ne: false } }).select("_id");
  await notifyUsers(users.map((user) => user._id), payload);
};
