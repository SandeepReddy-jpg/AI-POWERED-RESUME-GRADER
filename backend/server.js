import exp from "express";
import { config } from "dotenv";
import { connect } from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import { authApp } from "./API/authAPI.js";
import { resumeApp } from "./API/resumeAPI.js";
import { analysisApp } from "./API/analysisAPI.js";
import { jobMatchApp } from "./API/jobMatchAPI.js";

config();

const app = exp();

// CORS Middleware
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  }),
);

// Cookie Parser Middleware
app.use(cookieParser());

// Body Parser Middleware
app.use(exp.json());

app.use(exp.urlencoded({ extended: true }));

// Path Level Middleware
app.use("/api/auth", authApp);

app.use("/api/resume", resumeApp);

app.use("/api/analysis", analysisApp);

app.use("/api/job-match", jobMatchApp);

// Default Route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "AI Resume Analyzer API Running",
  });
});

// Connect Database
const connectDB = async () => {
  try {
    await connect(process.env.MONGO_URI);

    console.log("DB Connected");

    const port = process.env.PORT || 5000;

    const server = app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });

    // Handle port already in use error
    server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.log(`Port ${port} is already in use, trying port ${port + 1}...`);
        const fallbackPort = port + 1;
        const fallbackServer = app.listen(fallbackPort, () => {
          console.log(`Server listening on port ${fallbackPort}`);
        });
        fallbackServer.on("error", (fallbackErr) => {
          console.log("Failed to start server on fallback port:", fallbackErr.message);
          process.exit(1);
        });
      } else {
        console.log("Server error:", err.message);
        process.exit(1);
      }
    });
  } catch (err) {
    console.log("DB Connection Error", err.message);
    process.exit(1);
  }
};

connectDB();

// Invalid Path Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Path ${req.url} is invalid`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});
// Nodemon trigger reload 2