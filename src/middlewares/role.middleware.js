// middlewares/role.middleware.js
import { ApiError } from "../utils/ApiError.js";

// Middleware to check user role
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    const userRole = req.user?.role; // Ensure `req.user` contains role information

    if (!roles.includes(userRole)) {
      return next(new ApiError(403, "Access denied. Insufficient permissions."));
    }

    next();
  };
};
