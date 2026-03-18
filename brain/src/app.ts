import dotenv from "dotenv";
dotenv.config();
import express from "express";
import { errorHandler } from "./middlewares/error.middleware";
import { httpLogger } from "./middlewares/httpLogger.middleware";

/**
 * Express Application Instance.
 * 
 * Configures middleware, routes, and error handling.
 */
const app = express();

// app-level middleware config
app.use(httpLogger);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// router imports
import brainRouter from "./brain/route"
import googleTaskRouter from "./google-task/route"
import googleAuthRouter from "./google-auth/route"

// url mapping
app.use("/api/v1/brain", brainRouter)
app.use("/api/v1/google-tasks", googleTaskRouter)
app.use("/api/v1/google-auth", googleAuthRouter)


// global error handler
app.use(errorHandler);

// health check
app.get("/healthcheck", (req, res) => {
    res.status(200).json({
        message: "OK",
        timestamp: new Date().toISOString(),
    });
});


export default app;