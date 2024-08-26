import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Event } from "../models/event.model.js";  // Make sure to adjust the path if needed
import { ApiResponse } from "../utils/ApiResponse.js";

// Create a new event (admin only)
const createEvent = asyncHandler(async (req, res) => {
    const { title, description, date, type, host } = req.body;
    
    if (!title || !date || !type || !host) {
        throw new ApiError(400, "All fields are required");
    }

    // Ensure the event date is valid
    const eventDate = new Date(date);
    if (isNaN(eventDate.getTime())) {
        throw new ApiError(400, "Invalid date");
    }

    const newEvent = await Event.create({
        title,
        description,
        date: eventDate,
        type,
        host,
        created_by: req.user._id,  // Assuming admin/user ID is available in req.user
    });

    return res.status(201).json(new ApiResponse(201, newEvent, "Event created successfully"));
});

// Get all events
const getEvents = asyncHandler(async (req, res) => {
    const events = await Event.find();
    return res.status(200).json(new ApiResponse(200, events, "Events fetched successfully"));
});

// Get a single event by ID
const getEventById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const event = await Event.findById(id);
    if (!event) {
        throw new ApiError(404, "Event not found");
    }

    return res.status(200).json(new ApiResponse(200, event, "Event fetched successfully"));
});

// Update an event by ID (admin only)
const updateEvent = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, description, date, type, host } = req.body;
    
    const updatedEvent = await Event.findByIdAndUpdate(
        id,
        { title, description, date: new Date(date), type, host },
        { new: true }
    );

    if (!updatedEvent) {
        throw new ApiError(404, "Event not found");
    }

    return res.status(200).json(new ApiResponse(200, updatedEvent, "Event updated successfully"));
});

// Delete an event by ID (admin only)
const deleteEvent = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const deletedEvent = await Event.findByIdAndDelete(id);
    if (!deletedEvent) {
        throw new ApiError(404, "Event not found");
    }

    return res.status(200).json(new ApiResponse(200, {}, "Event deleted successfully"));
});

export {
    createEvent,
    getEvents,
    getEventById,
    updateEvent,
    deleteEvent
};
