import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

// CORS Middleware
const corsOptions = {
    origin: process.env.CORS_ORIGIN, // Ensure this matches your frontend origin
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};

app.use(cors(corsOptions));

// Middleware
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// Handle preflight OPTIONS requests
app.options('*', cors(corsOptions));

// Routes import
import userRouter from './routes/user.routes.js';
import pollRouter from './routes/polls.routes.js';  // Import the poll routes

// Routes declaration
app.use("/api/v1/users", userRouter);
app.use("/api/v1/polls", pollRouter);  // Add poll routes

// Catch-all for 404 errors (Route not found)
app.use((req, res, next) => {
    res.status(404).send("Route not found");
});

// Generic error handler for server errors
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Server Error");
});

// Optional: Log CORS headers (for debugging)
app.use((req, res, next) => {
    console.log('CORS Headers:', res.getHeaders());
    next();
});

export { app };
