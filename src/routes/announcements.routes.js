import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getAnnouncements, createAnnouncement, deleteAnnouncement } from "../controllers/announcements.controller.js";

const router = Router();
router.use(verifyJWT);
router.get("/", getAnnouncements);
router.post("/", createAnnouncement);
router.delete("/:id", deleteAnnouncement);

export default router;
