import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Event } from "../models/events.model.js"; // Corrected to singular 'event.model.js'
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";


const createEvent = asyncHandler(async (req, res) => {
    const {title, description, date, type, hostName, imageUrl, location, visibility, time } = req.body;
    if (req.user.role !== "admin") {
        throw new ApiError(403, "Only admins can create events");
    }

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
        location,
        visibility,
        time,
        created_by: req.user._id,
    });

    return res.status(201).json(new ApiResponse(201, newEvent, "Event created successfully"));
});

const getEvents = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, category, sort = "newest" } = req.query;
    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        sort: { date: sort === "oldest" ? 1 : -1 }, 
    };

    const match = category ? { type: category } : {};
    const eventsAggregate = Event.aggregate([
        { $match: match },
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

    const event = await Event.findById(eventId)
        .populate("host", "fullname username email avatar")
        .populate("attendees", "fullname avatar")
        .populate("rsvps.user", "fullname avatar");
    if (!event) {
        throw new ApiError(404, "Event not found");
    }

    const data = event.toObject();
    data.rsvpCounts = {
        going: data.rsvps.filter((item) => item.status === "going").length,
        maybe: data.rsvps.filter((item) => item.status === "maybe").length,
        not_going: data.rsvps.filter((item) => item.status === "not_going").length,
    };

    return res.status(200).json(new ApiResponse(200, data, "Event fetched successfully"));
});


const updateEvent = asyncHandler(async (req, res) => {
    const { eventId } = req.params;
    const { title, description, date, type, host, hostName, imageUrl, location, visibility, isFeatured } = req.body;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
        throw new ApiError(400, "Invalid event ID");
    }

    // --- Validation for update ---
    if (!title && !description && !date && !type && !host && !hostName && !imageUrl && !location && !visibility && isFeatured === undefined) {
        throw new ApiError(400, "At least one field must be provided to update");
    }

    const event = await Event.findById(eventId);
    if (!event) throw new ApiError(404, "Event not found");
    if (req.user.role !== "admin" && event.host.toString() !== req.user._id.toString()) throw new ApiError(403, "Access denied");

    const updateFields = { title, description, type, host, hostName, imageUrl, location, visibility, isFeatured };
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
    
    const event = await Event.findById(eventId);
    if (!event) throw new ApiError(404, "Event not found");
    if (req.user.role !== "admin" && event.host.toString() !== req.user._id.toString()) throw new ApiError(403, "Access denied");
    const deletedEvent = await Event.findByIdAndDelete(eventId);
    if (!deletedEvent) {
        throw new ApiError(404, "Event not found");
    }
    
    // TODO: Consider deleting associated gallery images and polls in the future.

    return res.status(200).json(new ApiResponse(200, { _id: eventId }, "Event deleted successfully"));
});

const rsvpEvent = asyncHandler(async (req, res) => {
    const { eventId } = req.params;
    const { status } = req.body;
    if (!["going", "maybe", "not_going"].includes(status)) throw new ApiError(400, "Invalid RSVP status");
    const event = await Event.findById(eventId);
    if (!event) throw new ApiError(404, "Event not found");
    event.rsvps = event.rsvps.filter((item) => item.user.toString() !== req.user._id.toString());
    event.rsvps.push({ user: req.user._id, status });
    event.attendees = status === "going" ? Array.from(new Set([...event.attendees.map(String), req.user._id.toString()])) : event.attendees.filter((id) => id.toString() !== req.user._id.toString());
    await event.save();
    return res.status(200).json(new ApiResponse(200, event.rsvps, "RSVP saved"));
});

const getRsvps = asyncHandler(async (req, res) => {
    const event = await Event.findById(req.params.eventId).populate("rsvps.user", "fullname avatar");
    if (!event) throw new ApiError(404, "Event not found");
    return res.status(200).json(new ApiResponse(200, event.rsvps, "RSVPs fetched"));
});

export {
    createEvent,
    getEvents,
    getEventById,
    updateEvent,
    deleteEvent,
    rsvpEvent,
    getRsvps
};
