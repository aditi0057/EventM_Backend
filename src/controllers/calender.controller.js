import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { Event } from "../models/events.model.js";


//  'REFERENCE' CALENDAR (ACTUAL DATES)

export const getPersonalCalendarEvents = asyncHandler(async (req, res) => {
    const { year, month } = req.query;
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);

    if (!yearNum || !monthNum || monthNum < 1 || monthNum > 12) {
        throw new ApiError(400, 'A valid year and month are required');
    }

  
    const usersWithEvents = await User.aggregate([
        {
            $match: {
                $or: [
                    { $expr: { $eq: [{ $month: "$dateOfBirth" }, monthNum] } },
                    { $expr: { $eq: [{ $month: "$anniversaryDate" }, monthNum] } },
                    { $expr: { $eq: [{ $month: "$workJoiningDate" }, monthNum] } }
                ]
            }
        }
    ]);


    const personalEvents = usersWithEvents.flatMap(user => {
        const events = [];
        if (user.dateOfBirth?.getMonth() + 1 === monthNum) {
            events.push({
                title: `${user.fullname}'s Birthday`,
                date: new Date(yearNum, monthNum - 1, user.dateOfBirth.getDate()),
                type: 'Birthday',
                isRecurring: true,
            });
        }

        if (user.anniversaryDate?.getMonth() + 1 === monthNum) {
            events.push({
                title: `${user.fullname}'s Anniversary`,
                date: new Date(yearNum, monthNum - 1, user.anniversaryDate.getDate()),
                type: 'Anniversary',
                isRecurring: true,
            });
        }
        if (user.workJoiningDate?.getMonth() + 1 === monthNum) {
             events.push({
                title: `${user.fullname}'s Work Anniversary`,
                date: new Date(yearNum, monthNum - 1, user.workJoiningDate.getDate()),
                type: 'Work Anniversary',
                isRecurring: true,
            });
        }
        return events;
    });

    personalEvents.sort((a, b) => a.date - b.date);

    return res.status(200).json(new ApiResponse(200, personalEvents, "Personal calendar events fetched successfully"));
});



// 'CELEBRATION' CALENDAR (PLANNED EVENTS)

export const getCompanyCalendarEvents = asyncHandler(async (req, res) => {
    const { year, month } = req.query;
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);

     if (!yearNum || !monthNum || monthNum < 1 || monthNum > 12) {
        throw new ApiError(400, 'A valid year and month are required');
    }

    //date range for the database query
    const startDate = new Date(yearNum, monthNum - 1, 1);
    const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);

    const companyEvents = await Event.find({
        date: { $gte: startDate, $lte: endDate }
    }).populate("host", "fullname").sort({ date: 1 });

    return res.status(200).json(new ApiResponse(200, companyEvents, "Company celebration events fetched successfully"));
});