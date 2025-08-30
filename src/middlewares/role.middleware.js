// middlewares/role.middleware.js
import { ApiError } from "../utils/ApiError.js";

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    const userRole = req.user?.role;

    if (!roles.includes(userRole)) {
      return next(new ApiError(403, "Access denied. Insufficient permissions."));
    }

    next();
  };
};
