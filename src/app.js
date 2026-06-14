import dotenv from "dotenv";
import connectDB from "./db/index.js";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

dotenv.config({ path: "./.env" });

const app = express();
const authHits = new Map();
const authRateLimit = (req, res, next) => {
    const key = req.ip;
    const now = Date.now();
    const hits = (authHits.get(key) || []).filter((time) => now - time < 1000);
    if (hits.length >= 5) {
        return res.status(429).json({ success: false, message: "Too many auth requests. Please slow down." });
    }
    hits.push(now);
    authHits.set(key, hits);
    next();
};

app.use(cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true
}));
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

import userRouter from "./routes/user.routes.js";
import eventRouter from "./routes/events.routes.js";
import pollRouter from "./routes/polls.routes.js";
import galleryRouter from "./routes/gallery.routes.js";
import calendarRouter from "./routes/calender.routes.js";
import dashboardRouter from "./routes/admin.routes.js";
import notificationRouter from "./routes/notifications.routes.js";
import announcementRouter from "./routes/announcements.routes.js";

app.use("/api/v1/users", authRateLimit, userRouter);
app.use("/api/v1/events", eventRouter);
app.use("/api/v1/polls", pollRouter);
app.use("/api/v1/gallery", galleryRouter);
app.use("/api/v1/calendar", calendarRouter);
app.use("/api/v1/dashboard", dashboardRouter);
app.use("/api/v1/admin", dashboardRouter);
app.use("/api/v1/notifications", notificationRouter);
app.use("/api/v1/announcements", announcementRouter);
app.use("/api/auth", authRateLimit, userRouter);
app.use("/api/users", authRateLimit, userRouter);
app.use("/api/events", eventRouter);
app.use("/api/polls", pollRouter);
app.use("/api/gallery", galleryRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/announcements", announcementRouter);
app.use("/api/admin", dashboardRouter);

app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
        success: false,
        statusCode,
        message: err.message || "Internal Server Error",
        errors: err.errors || [],
        ...(process.env.NODE_ENV === "development" ? { stack: err.stack } : {})
    });
});

connectDB()
    .then(() => {
        app.on("error", (error) => {
            throw error;
        });

        app.listen(process.env.PORT || 8000, () => {
            if (process.env.NODE_ENV === "development") {
                console.info(`Server is running at port: ${process.env.PORT || 8000}`);
            }
        });
    })
    .catch((err) => {
        console.error("Mongo DB connection failed", err);
    });

export { app };
