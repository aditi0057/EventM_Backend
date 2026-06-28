import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false }); 

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating tokens");
    }
};

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
};

const registerUser = asyncHandler(async (req, res) => {
    const { fullname, email, username, password, mobileNumber, dateOfBirth, maritalStatus, anniversaryDate, workJoiningDate } = req.body;

    // --- Validation ---
    if ([fullname, email, username, password].some((field) => !field || field.trim() === "")) {
        throw new ApiError(400, "Full name, email, username, and password are required");
    }

    const existedUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existedUser) {
        throw new ApiError(409, "User with this email or username already exists");
    }


    const avatarLocalPath = req.file?.path;
    const avatar = avatarLocalPath ? await uploadOnCloudinary(avatarLocalPath) : null;
    if (avatarLocalPath && !avatar) {
        throw new ApiError(500, "Failed to upload avatar, please try again");
    }


    const user = await User.create({
        fullname,
        email,
        username: username.toLowerCase(),
        password,
        avatar: avatar?.url || "",
        mobileNumber,
        dateOfBirth,
        maritalStatus: maritalStatus || "Prefer not to say",
        anniversaryDate: maritalStatus === 'Married' ? anniversaryDate : null,
        workJoiningDate,
        verificationToken: crypto.randomBytes(24).toString("hex"),
    });

    const createdUser = await User.findById(user._id).select("-password -refreshToken");
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user");
    }

    return res.status(201).json(new ApiResponse(201, createdUser, "User registered successfully"));
});


const loginUser = asyncHandler(async (req, res) => {
    const { email, username, password } = req.body;
    if (!username && !email) {
        throw new ApiError(400, "Username or email is required");
    }

    const user = await User.findOne({ $or: [{ email }, { username }] });
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid credentials");
    }
    if (user.emailVerified === false && process.env.REQUIRE_EMAIL_VERIFICATION === "true") {
        throw new ApiError(403, "Please verify your email before logging in");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    return res.status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken }, "User logged in successfully"));
});

const logOutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } }, { new: true });

    return res.status(200)
        .clearCookie("accessToken", cookieOptions)
        .clearCookie("refreshToken", cookieOptions)
        .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request");
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(decodedToken?._id);

        if (!user) {
            throw new ApiError(401, "Invalid refresh token");
        }

        if (incomingRefreshToken !== user.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or has been used");
        }

        const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshTokens(user._id);

        return res.status(200)
            .cookie("accessToken", accessToken, cookieOptions)
            .cookie("refreshToken", newRefreshToken, cookieOptions)
            .json(new ApiResponse(200, { accessToken, refreshToken: newRefreshToken }, "Access token refreshed successfully"));
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }
});

const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(new ApiResponse(200, req.user, "User profile fetched successfully"));
});

const getUserSettings = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select("notificationSettings");
    return res.status(200).json(new ApiResponse(200, user?.notificationSettings || {}, "Settings fetched"));
});

const updateUserSettings = asyncHandler(async (req, res) => {
    const user = await User.findByIdAndUpdate(
        req.user._id,
        { $set: { notificationSettings: req.body } },
        { new: true }
    ).select("notificationSettings");
    return res.status(200).json(new ApiResponse(200, user?.notificationSettings || {}, "Settings saved"));
});


const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
        throw new ApiError(400, "Old and new passwords are required");
    }

    const user = await User.findById(req.user._id);
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password");
    }

    user.password = newPassword;
    await user.save(); 

    return res.status(200).json(new ApiResponse(200, {}, "Password changed successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullname, email, mobileNumber, username, dateOfBirth, workJoiningDate, maritalStatus } = req.body;
    if (!fullname && !email && !mobileNumber && !username && !dateOfBirth && !workJoiningDate && !maritalStatus) {
        throw new ApiError(400, "At least one field to update must be provided");
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        { $set: { fullname, email, mobileNumber, username, dateOfBirth, workJoiningDate, maritalStatus } },
        { new: true }
    ).select("-password -refreshToken");

    return res.status(200).json(new ApiResponse(200, user, "Account details updated successfully"));
});

const verifyEmail = asyncHandler(async (req, res) => {
    const { token } = req.body;
    const user = await User.findOneAndUpdate({ verificationToken: token }, { emailVerified: true, $unset: { verificationToken: 1 } }, { new: true }).select("-password -refreshToken");
    if (!user) throw new ApiError(400, "Invalid verification token");
    return res.status(200).json(new ApiResponse(200, user, "Email verified"));
});

const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const token = crypto.randomBytes(24).toString("hex");
    await User.findOneAndUpdate({ email }, { passwordResetToken: token, passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000) });
    return res.status(200).json(new ApiResponse(200, { token: process.env.NODE_ENV === "development" ? token : undefined }, "If the account exists, a reset link has been sent"));
});

const resetPassword = asyncHandler(async (req, res) => {
    const { token, password } = req.body;
    const user = await User.findOne({ passwordResetToken: token, passwordResetExpires: { $gt: new Date() } });
    if (!user) throw new ApiError(400, "Invalid or expired reset token");
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    return res.status(200).json(new ApiResponse(200, {}, "Password reset successfully"));
});

const getUsers = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, q = "" } = req.query;
    const filter = q ? { $or: [{ fullname: new RegExp(q, "i") }, { email: new RegExp(q, "i") }] } : {};
    const users = await User.find(filter).select("-password -refreshToken").skip((page - 1) * limit).limit(Number(limit)).sort({ createdAt: -1 });
    const total = await User.countDocuments(filter);
    return res.status(200).json(new ApiResponse(200, { docs: users, total }, "Users fetched"));
});

const getUserById = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).select("-password -refreshToken");
    if (!user) throw new ApiError(404, "User not found");
    return res.status(200).json(new ApiResponse(200, user, "User fetched"));
});

const updateUserById = asyncHandler(async (req, res) => {
    if (req.user.role !== "admin" && req.user._id.toString() !== req.params.id) throw new ApiError(403, "Access denied");
    const user = await User.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true }).select("-password -refreshToken");
    return res.status(200).json(new ApiResponse(200, user, "User updated"));
});

const deleteUserById = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.params.id, { isActive: false });
    return res.status(200).json(new ApiResponse(200, {}, "User deactivated"));
});

const upcomingByDateField = async (field, days) => {
    const users = await User.find({ [field]: { $exists: true, $ne: null } }).select("fullname username email avatar dateOfBirth workJoiningDate");
    const now = new Date();
    const end = new Date(Date.now() + Number(days || 14) * 86400000);
    return users.filter((user) => {
        const source = new Date(user[field]);
        const next = new Date(now.getFullYear(), source.getMonth(), source.getDate());
        if (next < now) next.setFullYear(now.getFullYear() + 1);
        return next <= end;
    });
};

const getBirthdays = asyncHandler(async (req, res) => res.status(200).json(new ApiResponse(200, await upcomingByDateField("dateOfBirth", req.query.days), "Birthdays fetched")));
const getAnniversaries = asyncHandler(async (req, res) => res.status(200).json(new ApiResponse(200, await upcomingByDateField("workJoiningDate", req.query.days), "Anniversaries fetched")));


const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing");
    }

    const oldAvatarUrl = req.user.avatar;

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if (!avatar?.url) {
        throw new ApiError(500, "Error while uploading new avatar");
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        { $set: { avatar: avatar.url } },
        { new: true }
    ).select("-password -refreshToken");
    
    if (oldAvatarUrl) {
        await deleteFromCloudinary(oldAvatarUrl);
    }

    return res.status(200).json(new ApiResponse(200, user, "Avatar updated successfully"));
});


export {
    registerUser,
    loginUser,
    logOutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    verifyEmail,
    forgotPassword,
    resetPassword,
    getUsers,
    getUserById,
    updateUserById,
    deleteUserById,
    getBirthdays,
    getAnniversaries,
    getUserSettings,
    updateUserSettings,
};
