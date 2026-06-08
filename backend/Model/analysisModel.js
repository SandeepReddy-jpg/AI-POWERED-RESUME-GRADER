
import mongoose from "mongoose";
const analysisSchema = new mongoose.Schema(
  {
    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resume",
      required: [true, "Resume ID is required"],
      unique: true, 
    },

    atsScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    weaknesses: {
      type: [String],
      default: [],
    },

    missingSkills: {
      type: [String],
      default: [],
    },

    missingBonusSkills: {
      type: [String],
      default: [],
    },

    recommendations: {
      type: [String],
      default: [],
    },

    bulletPointRewrites: {
      type: [
        {
          original: String,
          rewritten: String,
          explanation: String,
        }
      ],
      default: [],
    },

    recruiterFeedback: {
      type: String,
      default: "",
    },
    improvedScorePrediction: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    scoreBreakdown: {
      skills: { type: Number, default: 0 },
      projects: { type: Number, default: 0 },
      formatting: { type: Number, default: 0 },
      achievements: { type: Number, default: 0 },
      grammar: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

const Analysis = mongoose.model("Analysis", analysisSchema);
export default Analysis;
