import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/user.routes.js";
import { errorHandeler } from "./middlewares/error.middleware.js";

const app = express();

app.use(cors({
    origin: process.env.cors_origin || "http://localhost:3000",
    credentials: true
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(express.static("public"));
app.use(cookieParser());

//for checking server status
app.get("/api/v1", (req, res) => {
    res.status(200).json({ status: "OK", message: "Server is running" });
});
// Routes
app.use("/api/v1/users", userRoutes);

app.use(errorHandeler); // Use error handler middleware



export default app;