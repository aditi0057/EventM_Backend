import mongoose, { Schema } from "mongoose";

const appSettingsSchema = new Schema({
  singleton: { type: String, default: "global", unique: true },
  requireEventApproval: { type: Boolean, default: false },
  allowUserEvents: { type: Boolean, default: true },
  requireGalleryApproval: { type: Boolean, default: true },
  birthdayReminderDays: { type: Number, default: 14 },
}, { timestamps: true });

export const AppSettings = mongoose.model("AppSettings", appSettingsSchema);
