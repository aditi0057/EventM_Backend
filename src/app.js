import dotenv from "dotenv";
import connectDB from "./db/index.js";
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

dotenv.config({
    path: './.env'
});

const app = express();
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

import userRouter from './routes/user.routes.js';
import eventRouter from './routes/events.routes.js';
import pollRouter from './routes/polls.routes.js';
import galleryRouter from './routes/gallery.routes.js';
import calendarRouter from './routes/calender.routes.js';
import dashboardRouter from './routes/admin.routes.js';

app.use("/api/v1/users", userRouter);
app.use("/api/v1/events", eventRouter);
app.use("/api/v1/polls", pollRouter);
app.use("/api/v1/gallery", galleryRouter);
app.use("/api/v1/calendar", calendarRouter);
app.use("/api/v1/dashboard", dashboardRouter);

connectDB()
    .then(() => {
        app.on("error", (error) => {
            console.log("SERVER ERROR: ", error);
            throw error;
        });

        app.listen(process.env.PORT || 8000, () => {
            console.log(`✅ Server is running at port: ${process.env.PORT || 8000}`);
        });
    })
    .catch((err) => {
        console.log("❌ MONGO DB connection failed !!! ", err);
    });

export { app };