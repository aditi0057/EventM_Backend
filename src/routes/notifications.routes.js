import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getNotifications, getUnreadCount, markAllNotificationsRead, markNotificationRead } from "../controllers/notifications.controller.js";

const router = Router();
router.use(verifyJWT);
router.get("/", getNotifications);
router.get("/unread-count", getUnreadCount);
router.patch("/mark-all-read", markAllNotificationsRead);
router.patch("/read-all", markAllNotificationsRead);
router.patch("/:id/read", markNotificationRead);

export default router;
