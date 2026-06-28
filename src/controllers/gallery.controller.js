import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Gallery, GalleryAlbum } from "../models/gallery.model.js";
import { Event } from "../models/events.model.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { AppSettings } from "../models/appsettings.model.js";
import { notifyUsers } from "../utils/notifications.js";

const uploadImage = asyncHandler(async (req, res) => {
    const { event_id, albumId, caption = "" } = req.body;
    const imageLocalPath = req.file?.path;

    if (!imageLocalPath) {
        throw new ApiError(400, "Image file is required");
    }
    if (event_id && !mongoose.Types.ObjectId.isValid(event_id)) {
        throw new ApiError(400, "Invalid Event ID format");
    }

    const event = event_id ? await Event.findById(event_id) : null;
    if (event_id && !event) {
        throw new ApiError(404, "Event not found");
    }

    let album = null;
    if (albumId) {
        if (!mongoose.Types.ObjectId.isValid(albumId)) throw new ApiError(400, "Invalid album ID");
        album = await GalleryAlbum.findById(albumId);
        if (!album) throw new ApiError(404, "Album not found");
    }

    const uploadsDir = path.resolve("public/uploads/gallery");
    fs.mkdirSync(uploadsDir, { recursive: true });
    const safeName = `${Date.now()}-${req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
    const finalPath = path.join(uploadsDir, safeName);
    fs.renameSync(imageLocalPath, finalPath);
    const settings = await AppSettings.findOne({ singleton: "global" });
    const status = settings?.requireGalleryApproval === false ? "approved" : "pending";

    const galleryImage = await Gallery.create({
        image_url: `/uploads/gallery/${safeName}`,
        event_id: event_id || undefined,
        albumId: album?._id,
        uploaded_by: req.user._id,
        caption,
        status,
        isApproved: status === "approved",
    });

    const populatedImage = await Gallery.findById(galleryImage._id)
        .populate("event_id", "title date")
        .populate("uploaded_by", "fullname username avatar");

    return res.status(201).json(new ApiResponse(201, { ...populatedImage.toObject(), success: true, photoId: galleryImage._id, status }, "Image uploaded successfully"));
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
    const { page = 1, limit = 10, status = "approved", albumId } = req.query;
    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        sort: { createdAt: -1 },
        populate: [
            { path: "event_id", select: "title date" },
            { path: "uploaded_by", select: "fullname username avatar" },
            { path: "albumId", select: "name description eventId" }
        ]
    };

    const filter = status === "pending" && req.user.role === "admin"
        ? { status: "pending" }
        : { status: "approved" };
    if (albumId) filter.albumId = albumId;
    const images = await Gallery.paginate(filter, options);

    return res.status(200).json(new ApiResponse(200, images, "Images fetched successfully"));
});


const getImagesByEvent = asyncHandler(async (req, res) => {
    const { eventId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
        throw new ApiError(400, "Invalid Event ID format");
    }

    const filter = req.user.role === 'admin'
        ? { event_id: eventId }
        : { event_id: eventId, status: "approved" };

    const images = await Gallery.find(filter)
        .populate("uploaded_by", "fullname username avatar")
        .sort({ createdAt: -1 });

    return res.status(200).json(new ApiResponse(200, images, "Event images fetched successfully"));
});

const getImagesByUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, "Invalid User ID format");
    }

    const filter = req.user.role === 'admin' || req.user._id.toString() === userId
        ? { uploaded_by: userId }
        : { uploaded_by: userId, status: "approved" };

    const images = await Gallery.find(filter)
        .populate("event_id", "title date")
        .sort({ createdAt: -1 });

    return res.status(200).json(new ApiResponse(200, images, "User images fetched successfully"));
});


const approveImage = asyncHandler(async (req, res) => {
    const { imageId } = req.params;
    const galleryItem = await Gallery.findByIdAndUpdate(imageId, { isApproved: true, status: "approved" }, { new: true })
        .populate("event_id", "title date")
        .populate("uploaded_by", "fullname username avatar");

    if (!galleryItem) {
        throw new ApiError(404, "Gallery item not found");
    }

    await notifyUsers([galleryItem.uploaded_by?._id || galleryItem.uploaded_by], {
        type: "approval",
        title: "Photo approved",
        message: "Your gallery photo was approved.",
        link: "/Gallery",
    });

    return res.status(200).json(new ApiResponse(200, galleryItem, "Gallery item approved"));
});

const rejectImage = asyncHandler(async (req, res) => {

    const { imageId } = req.params;
    const galleryItem = await Gallery.findById(imageId);

    if (!galleryItem) {
        throw new ApiError(404, "Gallery item not found");
    }
    
    galleryItem.status = "rejected";
    galleryItem.isApproved = false;
    await galleryItem.save();
    await notifyUsers([galleryItem.uploaded_by], {
        type: "approval",
        title: "Photo rejected",
        message: "Your gallery photo was rejected.",
        link: null,
    });

    return res.status(200).json(new ApiResponse(200, galleryItem, "Gallery item rejected"));
});

const getPendingImages = asyncHandler(async (req, res) => {
    const docs = await Gallery.find({ status: "pending" })
        .sort({ createdAt: -1 })
        .populate("uploaded_by", "fullname username avatar")
        .populate("albumId", "name");
    return res.status(200).json(new ApiResponse(200, { docs }, "Pending gallery fetched"));
});

const approveAllImages = asyncHandler(async (req, res) => {
    const pending = await Gallery.find({ status: "pending" }).select("_id uploaded_by");
    await Gallery.updateMany({ status: "pending" }, { status: "approved", isApproved: true });
    await notifyUsers(pending.map((item) => item.uploaded_by), {
        type: "approval",
        title: "Photo approved",
        message: "Your gallery photo was approved.",
        link: "/Gallery",
    });
    return res.status(200).json(new ApiResponse(200, { approved: pending.length }, "Pending photos approved"));
});

const createAlbum = asyncHandler(async (req, res) => {
    const { name, description = "", eventId } = req.body;
    if (!name?.trim()) throw new ApiError(400, "Album name is required");
    if (eventId && !mongoose.Types.ObjectId.isValid(eventId)) throw new ApiError(400, "Invalid event ID");
    const album = await GalleryAlbum.create({ name: name.trim(), description, eventId: eventId || undefined, createdBy: req.user._id });
    return res.status(201).json(new ApiResponse(201, album, "Album created"));
});

const getAlbums = asyncHandler(async (req, res) => {
    const docs = await GalleryAlbum.find().sort({ createdAt: -1 }).populate("eventId", "title date");
    return res.status(200).json(new ApiResponse(200, { docs }, "Albums fetched"));
});

const debugGallery = asyncHandler(async (req, res) => {
    const counts = await Gallery.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]);
    return res.status(200).json(new ApiResponse(200, counts.reduce((acc, item) => ({ ...acc, [item._id || "unknown"]: item.count }), {}), "Gallery debug counts"));
});

export {
    uploadImage,
    deleteImage,
    getAllImages,
    getImagesByEvent,
    getImagesByUser,
    approveImage,
    rejectImage,
    getPendingImages,
    approveAllImages,
    createAlbum,
    getAlbums,
    debugGallery,
};
