

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { Event } from "../models/events.model.js";
import { Poll } from "../models/polls.model.js";
import { Gallery } from "../models/gallery.model.js";
import { ApiError } from "../utils/ApiError.js";


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
        Poll.countDocuments({ isActive: true }),

        //  most recent 10 gallery images awaiting approval
        Gallery.find({ isApproved: false })
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
        Poll.countDocuments({ isActive: true }),
        Gallery.countDocuments({ isApproved: false }),
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
