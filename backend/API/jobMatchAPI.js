import exp from "express";
import OpenAI from "openai";
import verifyToken from "../middleware/verifyToken.js";
import Resume from "../Model/resumeModel.js";
import JobMatch from "../Model/jobMatchModel.js";
import User from "../Model/userModel.js";

export const jobMatchApp = exp.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Job Role Experience Level
const ROLE_EXPERIENCE_LEVEL = {
  junior: { minYears: 0, maxYears: 2, keywords: ["entry-level", "junior", "graduate", "fresher", "0-2 years"] },
  "mid-level": { minYears: 2, maxYears: 5, keywords: ["mid-level", "intermediate", "2-5 years", "3-5 years"] },
  senior: { minYears: 5, maxYears: 10, keywords: ["senior", "lead", "5+ years", "5-10 years", "principal"] },
  expert: { minYears: 10, maxYears: 100, keywords: ["expert", "principal", "architect", "10+ years", "technical fellow"] },
};

// Industry Keywords
const INDUSTRY_KEYWORDS = {
  tech: ["software", "tech", "it", "web", "mobile", "cloud", "devops", "ai", "ml", "blockchain"],
  finance: ["finance", "banking", "trading", "investment", "fintech", "accounting", "auditing"],
  healthcare: ["healthcare", "medical", "pharma", "hospital", "clinical", "diagnostics"],
  retail: ["retail", "ecommerce", "commerce", "shopping", "merchandise", "logistics"],
  education: ["education", "learning", "training", "teaching", "course", "university", "school"],
  manufacturing: ["manufacturing", "production", "supply chain", "operations", "logistics"],
};

// Calculate realistic Career Zenith-style score
const calculateCareerAlignmentScore = (resumeText, jobDescription, yearsOfExperience) => {
  const resumeLower = resumeText.toLowerCase();
  const jobLower = jobDescription.toLowerCase();

  // 1. Experience Level Alignment (25 points)
  let experienceLevelScore = 0;
  for (const [level, config] of Object.entries(ROLE_EXPERIENCE_LEVEL)) {
    const isMatching = config.keywords.some((kw) => jobLower.includes(kw));
    if (isMatching) {
      const expectedYears = (config.minYears + config.maxYears) / 2;
      const diff = Math.abs(yearsOfExperience - expectedYears);
      experienceLevelScore = Math.max(0, 25 - diff * 3);
      break;
    }
  }

  // 2. Industry Relevance (20 points)
  let industryScore = 0;
  let foundIndustry = false;
  for (const [industry, keywords] of Object.entries(INDUSTRY_KEYWORDS)) {
    const jobIndustryMatch = keywords.filter((kw) => jobLower.includes(kw)).length;
    const resumeIndustryMatch = keywords.filter((kw) => resumeLower.includes(kw)).length;
    if (jobIndustryMatch > 0 && resumeIndustryMatch > 0) {
      industryScore = Math.min(20, (resumeIndustryMatch / jobIndustryMatch) * 20);
      foundIndustry = true;
      break;
    }
  }
  if (!foundIndustry) {
    industryScore = 10; // Partial credit for exploring different industry
  }

  // 3. Skill Gap Analysis (30 points)
  const jobSkills = extractSkillsFromText(jobDescription);
  const resumeSkills = extractSkillsFromText(resumeText);
  const matchedSkills = jobSkills.filter((skill) => resumeSkills.includes(skill));
  const skillScore = (matchedSkills.length / Math.max(1, jobSkills.length)) * 30;

  // 4. Education Alignment (15 points)
  let educationScore = 0;
  const degreeKeywords = ["bachelor", "master", "phd", "degree", "diploma", "certification", "bootcamp"];
  const jobHasDegreeRequirement = degreeKeywords.some((deg) => jobLower.includes(deg));
  const resumeHasDegree = degreeKeywords.some((deg) => resumeLower.includes(deg));

  if (jobHasDegreeRequirement && resumeHasDegree) {
    educationScore = 15;
  } else if (!jobHasDegreeRequirement) {
    educationScore = 15; // No degree required
  } else if (resumeHasDegree) {
    educationScore = 10; // Has degree but job doesn't explicitly require it
  } else {
    educationScore = 5; // Missing degree
  }

  // 5. Company Size & Culture Fit (10 points)
  let cultureFitScore = 5; // Base score
  const startupKeywords = ["startup", "agile", "fast-paced", "innovative"];
  const corporateKeywords = ["fortune 500", "established", "enterprise", "large-scale"];

  const isStartupJob = startupKeywords.some((kw) => jobLower.includes(kw));
  const isStartupResume = startupKeywords.some((kw) => resumeLower.includes(kw));

  const isCorporateJob = corporateKeywords.some((kw) => jobLower.includes(kw));
  const isCorporateResume = corporateKeywords.some((kw) => resumeLower.includes(kw));

  if ((isStartupJob && isStartupResume) || (isCorporateJob && isCorporateResume)) {
    cultureFitScore = 10;
  }

  const totalScore = experienceLevelScore + industryScore + skillScore + educationScore + cultureFitScore;
  return {
    overall: Math.round(totalScore),
    components: {
      experienceLevel: Math.round(experienceLevelScore),
      industryRelevance: Math.round(industryScore),
      skillGap: Math.round(skillScore),
      educationAlignment: Math.round(educationScore),
      cultureFit: Math.round(cultureFitScore),
    },
  };
};

// Extract skills from text
const extractSkillsFromText = (text) => {
  const commonSkills = [
    "javascript",
    "python",
    "java",
    "c++",
    "react",
    "node.js",
    "express",
    "mongodb",
    "sql",
    "aws",
    "docker",
    "kubernetes",
    "git",
    "angular",
    "vue",
    "typescript",
    "html",
    "css",
    "tailwind",
    "bootstrap",
    "django",
    "flask",
    "spring boot",
    "rest api",
    "graphql",
    "ci/cd",
    "jenkins",
    "gitlab",
    "github",
    "jira",
    "agile",
    "scrum",
    "linux",
    "bash",
    "shell",
    "postgresql",
    "mysql",
    "redis",
    "elasticsearch",
    "machine learning",
    "deep learning",
    "nlp",
    "computer vision",
    "pandas",
    "numpy",
    "tensorflow",
    "pytorch",
    "scikit-learn",
  ];

  const textLower = text.toLowerCase();
  return commonSkills.filter((skill) => textLower.includes(skill));
};

// Calculate ATS Score for job
const calculateATSScore = (resumeText, jobDescription) => {
  const resumeLower = resumeText.toLowerCase();
  const jobLower = jobDescription.toLowerCase();

  // Extract keywords from job description
  const jobKeywords = extractKeywordsFromJob(jobDescription);
  const foundKeywords = jobKeywords.filter((kw) => resumeLower.includes(kw.toLowerCase()));

  const keywordScore = (foundKeywords.length / Math.max(1, jobKeywords.length)) * 40;

  // Check for formatting indicators
  let formatScore = 20; // Base formatting score
  if (resumeText.includes("\n") && resumeText.includes(" ")) formatScore += 10;
  if (!resumeText.includes("@") && !resumeText.includes("http")) formatScore -= 5; // No contact info
  formatScore = Math.min(30, formatScore);

  // Section presence
  let sectionScore = 0;
  const sections = ["experience", "education", "skills", "projects"];
  sections.forEach((section) => {
    if (resumeLower.includes(section)) sectionScore += 7.5;
  });
  sectionScore = Math.min(30, sectionScore);

  const totalATSScore = keywordScore + formatScore + sectionScore;
  return Math.min(100, Math.round(totalATSScore));
};

// Extract keywords from job description
const extractKeywordsFromJob = (jobDescription) => {
  const text = jobDescription.toLowerCase();
  const skills = extractSkillsFromText(jobDescription);
  const softSkills = [
    "communication",
    "leadership",
    "teamwork",
    "problem-solving",
    "analytical",
    "critical thinking",
    "time management",
    "project management",
    "customer service",
    "collaboration",
    "adaptability",
    "creativity",
    "attention to detail",
  ];

  const foundSoftSkills = softSkills.filter((skill) => text.includes(skill));
  return [...skills, ...foundSoftSkills];
};

// Extract keywords missing from resume
const getMissingKeywords = (resumeText, jobDescription) => {
  const resumeLower = resumeText.toLowerCase();
  const jobLower = jobDescription.toLowerCase();

  const jobKeywords = extractKeywordsFromJob(jobDescription);
  return jobKeywords.filter((kw) => !resumeLower.includes(kw.toLowerCase()));
};

// Get improvement suggestions from OpenAI
const getImprovementSuggestions = async (resumeText, jobDescription, jobTitle) => {
  try {
    const prompt = `You are an expert resume coach and career advisor. Analyze this resume against the job description and provide specific, actionable improvement suggestions.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

JOB TITLE: ${jobTitle}

Provide your response in the following JSON format:
{
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2"],
  "actionItems": ["action1", "action2", "action3"],
  "improvementsBySection": {
    "summary": "specific suggestion for summary section",
    "experience": "specific suggestion for experience section",
    "skills": "specific suggestion for skills section",
    "education": "specific suggestion for education section",
    "projects": "specific suggestion for projects section"
  },
  "suggestedResumeVersions": [
    {
      "title": "Version for ATS Optimization",
      "changes": ["change1", "change2"],
      "estimatedImpact": "Expected improvement in ATS parsing"
    }
  ]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const content = response.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return null;
  } catch (error) {
    console.error("OpenAI Error:", error.message);
    return null;
  }
};

// Main job match analysis endpoint
jobMatchApp.post("/analyze-job", verifyToken, async (req, res) => {
  try {
    const { resumeId, jobTitle, jobDescription, jobUrl, company } = req.body;
    const userId = req.userId;

    if (!resumeId || !jobTitle || !jobDescription) {
      return res.status(400).json({
        success: false,
        message: "resumeId, jobTitle, and jobDescription are required",
      });
    }

    // Get resume
    const resume = await Resume.findById(resumeId);
    if (!resume) {
      return res.status(404).json({
        success: false,
        message: "Resume not found",
      });
    }

    if (resume.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to analyze this resume",
      });
    }

    // Get user for experience calculation
    const user = await User.findById(userId);
    const yearsOfExperience = user?.yearsOfExperience || 0;

    // Extract resume text
    const resumeText = resume.content || "";

    // Calculate scores
    const careerAlignmentScore = calculateCareerAlignmentScore(resumeText, jobDescription, yearsOfExperience);
    const atsScore = calculateATSScore(resumeText, jobDescription);

    // Get missing keywords
    const missingKeywords = getMissingKeywords(resumeText, jobDescription);
    const requiredKeywords = extractKeywordsFromJob(jobDescription);

    // Calculate skills match
    const resumeSkills = extractSkillsFromText(resumeText);
    const jobSkills = extractSkillsFromText(jobDescription);
    const matchedSkills = resumeSkills.filter((skill) => jobSkills.includes(skill));
    const skillsMatchPercentage = jobSkills.length > 0 ? Math.round((matchedSkills.length / jobSkills.length) * 100) : 0;

    // Get AI suggestions
    const aiSuggestions = await getImprovementSuggestions(resumeText, jobDescription, jobTitle);

    // Overall match score (weighted average)
    const matchScore = Math.round(careerAlignmentScore.overall * 0.5 + atsScore * 0.3 + skillsMatchPercentage * 0.2);

    // Create job match record
    const jobMatch = new JobMatch({
      userId,
      resumeId,
      jobTitle,
      jobDescription,
      jobUrl,
      company,
      matchScore,
      atsScore,
      skillsMatch: {
        percentage: skillsMatchPercentage,
        matched: matchedSkills,
        missing: jobSkills.filter((skill) => !resumeSkills.includes(skill)),
        recommendations: aiSuggestions?.improvementsBySection?.skills ? [aiSuggestions.improvementsBySection.skills] : [],
      },
      careerAlignmentScore,
      keywords: {
        required: requiredKeywords,
        missing: missingKeywords,
        suggestions: missingKeywords.slice(0, 5), // Top 5 missing keywords
      },
      improvementsBySection: aiSuggestions?.improvementsBySection || {},
      detailedFeedback: {
        strengths: aiSuggestions?.strengths || [],
        weaknesses: aiSuggestions?.weaknesses || [],
        actionItems: aiSuggestions?.actionItems || [],
      },
      suggestedResumeVersions: aiSuggestions?.suggestedResumeVersions || [],
    });

    await jobMatch.save();

    res.status(201).json({
      success: true,
      message: "Job analysis completed successfully",
      data: {
        matchScore,
        atsScore,
        careerAlignmentScore,
        skillsMatch: {
          percentage: skillsMatchPercentage,
          matched: matchedSkills,
          missing: jobSkills.filter((skill) => !resumeSkills.includes(skill)),
        },
        keywords: {
          required: requiredKeywords.slice(0, 10),
          missing: missingKeywords.slice(0, 10),
          suggestions: missingKeywords.slice(0, 5),
        },
        improvements: {
          strengths: aiSuggestions?.strengths || [],
          weaknesses: aiSuggestions?.weaknesses || [],
          actionItems: aiSuggestions?.actionItems || [],
          bySection: aiSuggestions?.improvementsBySection || {},
        },
        suggestedVersions: aiSuggestions?.suggestedResumeVersions || [],
        jobMatchId: jobMatch._id,
      },
    });
  } catch (error) {
    console.error("Job Match Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to analyze job match",
    });
  }
});

// Get all job matches for user
jobMatchApp.get("/matches", verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const matches = await JobMatch.find({ userId }).sort({ createdAt: -1 }).populate("resumeId", "title");

    res.status(200).json({
      success: true,
      data: matches,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get single job match
jobMatchApp.get("/matches/:matchId", verifyToken, async (req, res) => {
  try {
    const { matchId } = req.params;
    const userId = req.userId;

    const match = await JobMatch.findById(matchId);

    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Job match not found",
      });
    }

    if (match.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this match",
      });
    }

    res.status(200).json({
      success: true,
      data: match,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Delete job match
jobMatchApp.delete("/matches/:matchId", verifyToken, async (req, res) => {
  try {
    const { matchId } = req.params;
    const userId = req.userId;

    const match = await JobMatch.findById(matchId);

    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Job match not found",
      });
    }

    if (match.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this match",
      });
    }

    await JobMatch.findByIdAndDelete(matchId);

    res.status(200).json({
      success: true,
      message: "Job match deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});
