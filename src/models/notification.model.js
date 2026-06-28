import mongoose, { Schema } from "mongoose";

const notificationSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, required: true },
  title: { type: String, default: "" },
  message: { type: String, required: true },
  link: { type: String, default: null },
  isRead: { type: Boolean, default: false },
  read: { type: Boolean, default: false }
}, { timestamps: true });

export const Notification = mongoose.model("Notification", notificationSchema);
