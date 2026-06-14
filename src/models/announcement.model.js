import mongoose, { Schema } from "mongoose";

const announcementSchema = new Schema({
  body: { type: String, required: true },
  sendTo: { type: String, enum: ["All users", "Select departments"], default: "All users" },
  priority: { type: String, enum: ["Normal", "Urgent"], default: "Normal" },
  scheduledFor: Date,
  createdBy: { type: Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

export const Announcement = mongoose.model("Announcement", announcementSchema);
