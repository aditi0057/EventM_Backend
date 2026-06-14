import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getNotifications, markAllNotificationsRead, markNotificationRead } from "../controllers/notifications.controller.js";

const router = Router();
router.use(verifyJWT);
router.get("/", getNotifications);
router.patch("/read-all", markAllNotificationsRead);
router.patch("/:id/read", markNotificationRead);

export default router;
