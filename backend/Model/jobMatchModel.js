import mongoose from "mongoose";

const jobMatchSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resume",
      required: true,
    },
    jobTitle: {
      type: String,
      required: true,
      trim: true,
    },
    jobDescription: {
      type: String,
      required: true,
    },
    jobUrl: {
      type: String,
      trim: true,
    },
    company: {
      type: String,
      trim: true,
    },
    matchScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    atsScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    skillsMatch: {
      percentage: Number,
      matched: [String],
      missing: [String],
      recommendations: [String],
    },
    careerAlignmentScore: {
      overall: Number,
      components: {
        experienceLevel: Number,
        industryRelevance: Number,
        skillGap: Number,
        educationAlignment: Number,
      },
    },
    keywords: {
      required: [String],
      missing: [String],
      suggestions: [String],
    },
    improvementsBySection: {
      summary: String,
      experience: String,
      skills: String,
      education: String,
      projects: String,
    },
    detailedFeedback: {
      strengths: [String],
      weaknesses: [String],
      actionItems: [String],
    },
    suggestedResumeVersions: [
      {
        title: String,
        changes: [String],
        estimatedImpact: String,
      },
    ],
    analysis: mongoose.Schema.Types.Mixed,
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const JobMatch = mongoose.model("JobMatch", jobMatchSchema);
export default JobMatch;
