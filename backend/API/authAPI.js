import exp from "express";
import jwt from "jsonwebtoken";
import User from "../Model/userModel.js";
import verifyToken from "../middleware/verifyToken.js";

export const authApp = exp.Router();

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    },
  );
};

// Register User
authApp.post("/register", async (req, res) => {
  try {
    // Get User Data
    const { name, email, password } = req.body;

    // Validate Fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Check Existing User
    const existingUser = await User.findOne({
      email: email.toLowerCase(),
    });

    // User Already Exists
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists",
      });
    }

    // Create User
    const newUser = await User.create({
      name,
      email,
      password,
    });

    // Generate Token
    const token = generateToken(newUser._id);

    // Send Response
    res.status(201).json({
      success: true,
      message: "Registration successful",
      token,
      payload: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        createdAt: newUser.createdAt,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// Login User
authApp.post("/login", async (req, res) => {
  try {
    // Get Login Data
    const { email, password } = req.body;

    // Validate Fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find User
    const user = await User.findOne({
      email: email.toLowerCase(),
    });

    // User Not Found
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Compare Password
    const isMatch = await user.comparePassword(password);

    // Password Incorrect
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Generate Token
    const token = generateToken(user._id);

    // Send Response
    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      payload: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// Get User Profile
authApp.get(
  "/profile",
  verifyToken,
  async (req, res) => {
    try {
      res.status(200).json({
        success: true,
        message: "Profile fetched successfully",
        payload: req.user,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  },
);