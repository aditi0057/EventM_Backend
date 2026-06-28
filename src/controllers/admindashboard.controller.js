

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { Event } from "../models/events.model.js";
import { Poll } from "../models/polls.model.js";
import { Vote } from "../models/votes.model.js";
import { Gallery } from "../models/gallery.model.js";
import { ApiError } from "../utils/ApiError.js";
import { AppSettings } from "../models/appsettings.model.js";

const activePollFilter = () => ({ isActive: true, end_time: { $gt: new Date() } });


export const getAdminDashboardData = asyncHandler(async (req, res) => {
    // Use Promise.all to run all independent database queries in parallel for speed
    const [
        totalUsers,
        totalEvents,
        activePolls,
        pendingApprovals
    ] = await Promise.all([
        // total number of registered users
        User.countDocuments(),

        // total number of created events
        Event.countDocuments(),

        // count of currently active polls
        Poll.countDocuments(activePollFilter()),

        //  most recent 10 gallery images awaiting approval
        Gallery.find({ status: "pending" })
            .sort({ createdAt: -1 })
            .limit(10)
            .populate("uploaded_by", "fullname email")
    ]);

    const thisMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const thisMonthEvents = await Event.countDocuments({ createdAt: { $gte: thisMonthStart } });

    const dashboardData = {
        totalUsers,
        totalEvents,
        activePolls,
        pendingGallery: pendingApprovals.length,
        thisMonthEvents,
        stats: { totalUsers, totalEvents, activePolls },
        moderationQueue: { pendingApprovals, pendingCount: pendingApprovals.length }
    };

    return res.status(200).json(new ApiResponse(200, dashboardData, "Admin dashboard data fetched successfully"));
});

export const getAdminStats = asyncHandler(async (req, res) => {
    const thisMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const [totalUsers, totalEvents, activePolls, pendingGallery, thisMonthEvents] = await Promise.all([
        User.countDocuments(),
        Event.countDocuments(),
        Poll.countDocuments(activePollFilter()),
        Gallery.countDocuments({ status: "pending" }),
        Event.countDocuments({ createdAt: { $gte: thisMonthStart } })
    ]);
    return res.status(200).json(new ApiResponse(200, { totalUsers, totalEvents, activePolls, pendingGallery, thisMonthEvents }, "Admin stats fetched"));
});

export const getAdminUsers = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, q = "" } = req.query;
    const filter = q ? { $or: [{ fullname: new RegExp(q, "i") }, { email: new RegExp(q, "i") }, { username: new RegExp(q, "i") }] } : {};
    const docs = await User.find(filter).select("-password -refreshToken").sort({ createdAt: -1 }).skip((Number(page) - 1) * Number(limit)).limit(Number(limit));
    const total = await User.countDocuments(filter);
    return res.status(200).json(new ApiResponse(200, { docs, total, page: Number(page), limit: Number(limit) }, "Admin users fetched"));
});

export const updateAdminUserRole = asyncHandler(async (req, res) => {
    const { role } = req.body;
    if (!["user", "admin"].includes(role)) throw new ApiError(400, "Invalid role");
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select("-password -refreshToken");
    return res.status(200).json(new ApiResponse(200, user, "User role updated"));
});

export const updateAdminUserStatus = asyncHandler(async (req, res) => {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: Boolean(req.body.isActive) }, { new: true }).select("-password -refreshToken");
    return res.status(200).json(new ApiResponse(200, user, "User status updated"));
});

export const deleteAdminUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.params.id, { isActive: false });
    return res.status(200).json(new ApiResponse(200, {}, "User deleted"));
});

export const getAdminUserActivity = asyncHandler(async (req, res) => {
    const userId = req.params.id;
    const [eventsCreated, rsvps, pollsVoted, photosUploaded] = await Promise.all([
        Event.find({ created_by: userId }).select("title date type").sort({ createdAt: -1 }).limit(20),
        Event.find({ "rsvps.user": userId }).select("title date rsvps").sort({ date: -1 }).limit(20),
        Vote.countDocuments({ user_id: userId }),
        Gallery.find({ uploaded_by: userId }).select("image_url caption status createdAt").sort({ createdAt: -1 }).limit(20),
    ]);
    return res.status(200).json(new ApiResponse(200, { eventsCreated, rsvps, pollsVoted, photosUploaded }, "User activity fetched"));
});

export const getAdminSettings = asyncHandler(async (req, res) => {
    const settings = await AppSettings.findOneAndUpdate(
        { singleton: "global" },
        { $setOnInsert: { singleton: "global" } },
        { upsert: true, new: true }
    );
    return res.status(200).json(new ApiResponse(200, settings, "Admin settings fetched"));
});

export const updateAdminSettings = asyncHandler(async (req, res) => {
    const update = {};
    ["requireEventApproval", "allowUserEvents", "requireGalleryApproval"].forEach((key) => {
        if (req.body[key] !== undefined) update[key] = Boolean(req.body[key]);
    });
    if (req.body.birthdayReminderDays !== undefined) update.birthdayReminderDays = Number(req.body.birthdayReminderDays);
    const settings = await AppSettings.findOneAndUpdate({ singleton: "global" }, { $set: update }, { upsert: true, new: true });
    return res.status(200).json(new ApiResponse(200, settings, "Admin settings saved"));
});
