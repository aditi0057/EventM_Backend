import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Gallery } from "../models/gallery.model.js";
import { Event } from "../models/events.model.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import mongoose from "mongoose";

const uploadImage = asyncHandler(async (req, res) => {
    const { event_id } = req.body;
    const imageLocalPath = req.file?.path;

    if (!imageLocalPath) {
        throw new ApiError(400, "Image file is required");
    }
    if (!event_id) {
        throw new ApiError(400, "Event ID is required");
    }
    if (!mongoose.Types.ObjectId.isValid(event_id)) {
        throw new ApiError(400, "Invalid Event ID format");
    }

    const event = await Event.findById(event_id);
    if (!event) {
        throw new ApiError(404, "Event not found");
    }

    const image = await uploadOnCloudinary(imageLocalPath);
    if (!image?.url) {
        throw new ApiError(500, "Failed to upload image to Cloudinary");
    }

    const galleryImage = await Gallery.create({
        image_url: image.url,
        event_id,
        uploaded_by: req.user._id,
    });

    return res.status(201).json(new ApiResponse(201, galleryImage, "Image uploaded successfully"));
});


const deleteImage = asyncHandler(async (req, res) => {
    const { imageId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(imageId)) {
        throw new ApiError(400, "Invalid Image ID format");
    }

    const image = await Gallery.findById(imageId);
    if (!image) {
        throw new ApiError(404, "Image not found");
    }

    // --- Security Check ---

    if (image.uploaded_by.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        throw new ApiError(403, "You are not authorized to delete this image");
    }

    await deleteFromCloudinary(image.image_url);


    await Gallery.findByIdAndDelete(imageId);

    return res.status(200).json(new ApiResponse(200, { _id: imageId }, "Image deleted successfully"));
});

const getAllImages = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        sort: { createdAt: -1 },
        populate: [
            { path: "event_id", select: "title date" }, // Corrected 'name' to 'title'
            { path: "uploaded_by", select: "username avatar" }
        ]
    };

    const images = await Gallery.paginate({}, options);

    return res.status(200).json(new ApiResponse(200, images, "Images fetched successfully"));
});


const getImagesByEvent = asyncHandler(async (req, res) => {
    const { eventId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
        throw new ApiError(400, "Invalid Event ID format");
    }

    const images = await Gallery.find({ event_id: eventId })
        .populate("uploaded_by", "username avatar")
        .sort({ createdAt: -1 });

    return res.status(200).json(new ApiResponse(200, images, "Event images fetched successfully"));
});

const getImagesByUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, "Invalid User ID format");
    }

    const images = await Gallery.find({ uploaded_by: userId })
        .populate("event_id", "title date") // Corrected 'name' to 'title'
        .sort({ createdAt: -1 });

    return res.status(200).json(new ApiResponse(200, images, "User images fetched successfully"));
});


const approveImage = asyncHandler(async (req, res) => {
    const { imageId } = req.params;
    const galleryItem = await Gallery.findByIdAndUpdate(imageId, { isApproved: true }, { new: true });

    if (!galleryItem) {
        throw new ApiError(404, "Gallery item not found");
    }

    return res.status(200).json(new ApiResponse(200, galleryItem, "Gallery item approved"));
});

const rejectImage = asyncHandler(async (req, res) => {

    const { imageId } = req.params;
    const galleryItem = await Gallery.findById(imageId);

    if (!galleryItem) {
        throw new ApiError(404, "Gallery item not found");
    }
    
    await deleteFromCloudinary(galleryItem.image_url); // Assuming you have this helper
    await Gallery.findByIdAndDelete(imageId);

    return res.status(200).json(new ApiResponse(200, {}, "Gallery item rejected and deleted"));
});


export {
    uploadImage,
    deleteImage,
    getAllImages,
    getImagesByEvent,
    getImagesByUser,
    approveImage,
    rejectImage,
};