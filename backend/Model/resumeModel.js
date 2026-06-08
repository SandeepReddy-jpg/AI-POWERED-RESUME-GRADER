import mongoose from "mongoose";

const resumeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    resumeUrl: {
      type: String,
      default: null,
    },

    fileData: {
      type: Buffer,
    },

    fileMimeType: {
      type: String,
    },

    originalFileName: {
      type: String,
      required: [true, "Original file name is required"],
      trim: true,
    },

    
    parsedText: {
      type: String,
      default: "",
    },

    targetRole: {
      type: String,
      enum: [
        "Frontend Developer",
        "Backend Developer",
        "Full Stack Developer",
        "Data Analyst",
        "Data Scientist",
        "DevOps Engineer",
        "Product Manager",
        "UI/UX Designer",
        "Mobile Developer",
        "QA Engineer",
      ],
      required: [true, "Target role is required"],
    },

    fileType: {
      type: String,
      enum: ["pdf", "docx"],
      default: "pdf",
    },
  },
  {
    timestamps: true, 
  }
);

const Resume = mongoose.model("Resume", resumeSchema);
export default Resume;
