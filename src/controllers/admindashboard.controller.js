

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { Event } from "../models/events.model.js";
import { Poll } from "../models/polls.model.js";
import { Gallery } from "../models/gallery.model.js";


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

    const dashboardData = {
        stats: {
            totalUsers,
            totalEvents,
            activePolls,
        },
        moderationQueue: {
            pendingApprovals,
            pendingCount: pendingApprovals.length 
        }
    };

    return res.status(200).json(new ApiResponse(200, dashboardData, "Admin dashboard data fetched successfully"));
});