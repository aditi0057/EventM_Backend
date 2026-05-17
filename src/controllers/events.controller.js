import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Event } from "../models/events.model.js"; // Corrected to singular 'event.model.js'
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";


const createEvent = asyncHandler(async (req, res) => {
    const {title, description, date, type, hostName, imageUrl } = req.body;

    if (!title || !date || !type || !hostName) {
        throw new ApiError(400, "Title, date, type, and host are required fields");
    }

    const eventDate = new Date(date);
    if (Number.isNaN(eventDate.getTime())) {
        throw new ApiError(400, "A valid event date is required");
    }

    const newEvent = await Event.create({
        title,
        description,
        date: eventDate,
        type,
        host: req.user._id,
        hostName,
        imageUrl,
        created_by: req.user._id,
    });

    return res.status(201).json(new ApiResponse(201, newEvent, "Event created successfully"));
});

const getEvents = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        sort: { date: -1 }, 
    };

    const eventsAggregate = Event.aggregate([
        {
            $lookup: {
                from: "users",
                localField: "host",
                foreignField: "_id",
                as: "host"
            }
        },
        {
            $unwind: {
                path: "$host",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $project: {
                "host.password": 0,
                "host.refreshToken": 0
            }
        }
    ]);
    const events = await Event.aggregatePaginate(eventsAggregate, options);

    if (!events || events.docs.length === 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, { docs: [] }, "No events yet"));
    }

    return res.status(200).json(new ApiResponse(200, events, "Events fetched successfully"));
});


const getEventById = asyncHandler(async (req, res) => {
    const { eventId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
        throw new ApiError(400, "Invalid event ID");
    }

    const event = await Event.findById(eventId).populate("host", "fullname username email avatar");
    if (!event) {
        throw new ApiError(404, "Event not found");
    }

    return res.status(200).json(new ApiResponse(200, event, "Event fetched successfully"));
});


const updateEvent = asyncHandler(async (req, res) => {
    const { eventId } = req.params;
    const { title, description, date, type, host, hostName, imageUrl } = req.body;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
        throw new ApiError(400, "Invalid event ID");
    }

    // --- Validation for update ---
    if (!title && !description && !date && !type && !host && !hostName && !imageUrl) {
        throw new ApiError(400, "At least one field must be provided to update");
    }

    const updateFields = { title, description, type, host, hostName, imageUrl };
    if (date) {
        const eventDate = new Date(date);
        if (Number.isNaN(eventDate.getTime())) {
            throw new ApiError(400, "A valid event date is required");
        }
        updateFields.date = eventDate;
    }
    Object.keys(updateFields).forEach((key) => updateFields[key] === undefined && delete updateFields[key]);

    const updatedEvent = await Event.findByIdAndUpdate(
        eventId,
        {
            $set: updateFields,
        },
        { new: true }
    ).populate("host", "fullname username email avatar");

    if (!updatedEvent) {
        throw new ApiError(404, "Event not found");
    }

    return res.status(200).json(new ApiResponse(200, updatedEvent, "Event updated successfully"));
});


const deleteEvent = asyncHandler(async (req, res) => {
    const { eventId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
        throw new ApiError(400, "Invalid event ID");
    }
    
    const deletedEvent = await Event.findByIdAndDelete(eventId);
    if (!deletedEvent) {
        throw new ApiError(404, "Event not found");
    }
    
    // TODO: Consider deleting associated gallery images and polls in the future.

    return res.status(200).json(new ApiResponse(200, { _id: eventId }, "Event deleted successfully"));
});

export {
    createEvent,
    getEvents,
    getEventById,
    updateEvent,
    deleteEvent
};
