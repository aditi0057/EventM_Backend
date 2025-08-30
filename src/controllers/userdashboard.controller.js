import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { Event } from "../models/events.model.js";
import { Poll } from "../models/polls.model.js";
import { Gallery } from "../models/gallery.model.js";

const getUserDashboardData = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const [
        userDetails,
        upcomingEvents,
        activePolls,
        galleryContributions
    ] = await Promise.all([
        //Fetch user details
        User.findById(userId).select('-password -refreshToken'),

        //Fetch upcoming events where the user is an attendee
        Event.find({
            attendees: userId, 
            date: { $gte: new Date() } 
        }).sort({ date: 1 }).limit(5), 

        // Fetch active polls
        Poll.find({
            isActive: true
        }).sort({ createdAt: -1 }).limit(5),

        //  Fetch the user's most recent gallery contributions
        Gallery.find({
            uploaded_by: userId // Corrected field name from 'uploadedBy'
        }).sort({ createdAt: -1 }).limit(6)
    ]);

    const dashboardData = {
        userDetails,
        upcomingEvents,
        activePolls,
        galleryContributions
    };

    return res.status(200).json(new ApiResponse(200, dashboardData, "Dashboard data fetched successfully"));
});

export { getUserDashboardData };