import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });

        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        return response;

    } catch (error) {
        if (localFilePath && fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        console.error("Cloudinary upload failed:", error);
        return null;
    }
};

const deleteFromCloudinary = async (fileUrl) => {
    try {
        if (!fileUrl) return null;
        const publicId = fileUrl.split('/').pop().split('.')[0];
        const response = await cloudinary.uploader.destroy(publicId);
        return response;

    } catch (error) {
        console.error("Cloudinary deletion failed:", error);
        return null;
    }
};


export { uploadOnCloudinary, deleteFromCloudinary };
