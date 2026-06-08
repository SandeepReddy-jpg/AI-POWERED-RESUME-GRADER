import exp from "express";
import OpenAI from "openai";
import verifyToken from "../middleware/verifyToken.js";
import Resume from "../Model/resumeModel.js";
import Analysis from "../Model/analysisModel.js";
export const analysisApp = exp.Router();
// Role Skills
const ROLE_SKILLS = {
  "Frontend Developer": {
    core: ["html", "html5", "css", "css3", "javascript", "es6", "react", "git", "responsive design"],
    bonus: ["redux", "vue", "angular", "tailwind", "bootstrap", "sass", "typescript", "next.js", "webpack", "vite", "rest api", "graphql", "jest", "cypress", "web performance", "accessibility", "figma"]
  },
  "Backend Developer": {
    core: ["node.js", "express", "python", "java", "sql", "nosql", "rest api", "authentication", "git"],
    bonus: ["django", "spring boot", "c#", ".net", "go", "ruby on rails", "mongodb", "postgresql", "mysql", "jwt", "redis", "docker", "kubernetes", "aws", "gcp", "azure", "graphql", "microservices", "ci/cd", "kafka", "rabbitmq"]
  },
  "Full Stack Developer": {
    core: ["html", "css", "javascript", "react", "node.js", "express", "sql", "git", "rest api"],
    bonus: ["typescript", "vue", "angular", "python", "django", "mongodb", "postgresql", "tailwind", "docker", "aws", "graphql", "ci/cd", "redis", "linux", "agile"]
  },
  "Data Analyst": {
    core: ["python", "sql", "excel", "data visualization", "statistics", "data cleaning"],
    bonus: ["r", "power bi", "tableau", "looker", "machine learning", "pandas", "numpy", "matplotlib", "seaborn", "a/b testing", "google analytics", "etl", "predictive modeling"]
  },
  "Data Scientist": {
    core: ["python", "sql", "machine learning", "statistics", "pandas", "numpy", "scikit-learn", "data visualization"],
    bonus: ["r", "deep learning", "nlp", "tensorflow", "pytorch", "keras", "tableau", "hadoop", "spark", "aws", "big data", "predictive modeling"]
  },
  "DevOps Engineer": {
    core: ["linux", "bash", "python", "docker", "ci/cd", "git", "networking"],
    bonus: ["kubernetes", "jenkins", "gitlab ci", "github actions", "terraform", "ansible", "chef", "puppet", "aws", "azure", "gcp", "prometheus", "grafana", "elk stack", "nginx"]
  },
  "Product Manager": {
    core: ["agile", "scrum", "roadmap", "product strategy", "user stories", "market research", "stakeholder management"],
    bonus: ["analytics", "sql", "jira", "confluence", "wireframing", "a/b testing", "kpis", "go-to-market", "customer development", "figma"]
  },
  "UI/UX Designer": {
    core: ["figma", "wireframing", "prototyping", "user research", "ui design", "ux design", "interaction design"],
    bonus: ["sketch", "adobe xd", "information architecture", "usability testing", "user flows", "design systems", "html", "css", "adobe creative suite"]
  },
  "Mobile Developer": {
    core: ["swift", "kotlin", "java", "react native", "mobile design", "api integration", "ui/ux", "git"],
    bonus: ["flutter", "objective-c", "xcode", "android studio", "sqlite", "core data", "firebase", "app store", "google play", "rest api"]
  },
  "QA Engineer": {
    core: ["selenium", "unit testing", "integration testing", "automation", "python", "javascript", "bug tracking", "api testing"],
    bonus: ["playwright", "cypress", "jest", "mocha", "java", "ci/cd", "jira", "postman", "performance testing", "jmeter"]
  }
};

// Strong Action Verbs
const STRONG_ACTION_VERBS = [
  "developed", "built", "implemented", "optimized", "designed", "created",
  "improved", "deployed", "spearheaded", "engineered", "architected",
  "orchestrated", "transformed", "modernized", "streamlined", "accelerated",
  "integrated", "pioneered", "resolved", "maximized", "revamped",
  "mentored", "led", "managed", "delivered", "executed", "formulated",
  "automated", "secured", "conceptualized"
];

// Weak Phrases
const WEAK_PHRASES = [
  "worked on", "responsible for", "helped with", "assisted in", "duties included",
  "participated in", "contributed to", "involved in", "tried to", "was assigned",
  "handled", "tasked with", "part of a team that", "in charge of"
];

// Resume Sections
const SECTION_KEYWORDS = [
  "skills",
  "projects",
  "experience",
  "education",
  "achievements",
];

// ATS Score Calculation
const calculateATSScore = (resumeText, targetRole) => {
  const textLower = resumeText.toLowerCase();

  const roleConfig = ROLE_SKILLS[targetRole] || { core: [], bonus: [] };
  const coreSkills = roleConfig.core || [];
  const bonusSkills = roleConfig.bonus || [];

  // Found Skills
  const foundCoreSkills = coreSkills.filter((skill) => textLower.includes(skill.toLowerCase()));
  const foundBonusSkills = bonusSkills.filter((skill) => textLower.includes(skill.toLowerCase()));

  // Missing Skills
  const missingSkills = coreSkills.filter((skill) => !textLower.includes(skill.toLowerCase())); // Core
  const missingBonusSkills = bonusSkills.filter((skill) => !textLower.includes(skill.toLowerCase())); // Bonus

  // 1. Skills Score (35 points)
  // Heavily weight Core skills (25 points), Bonus skills provide the rest (10 points)
  const coreMatchRatio = coreSkills.length > 0 ? foundCoreSkills.length / coreSkills.length : 1;
  const coreScore = Math.min(25, Math.round((coreMatchRatio / 0.7) * 25)); // Curve: 70% match is excellent

  const bonusMatchRatio = bonusSkills.length > 0 ? foundBonusSkills.length / bonusSkills.length : 1;
  const bonusScore = Math.min(10, Math.round((bonusMatchRatio / 0.3) * 10)); // Curve: 30% match is excellent

  const skillsScore = coreScore + bonusScore;

  // 2. Experience & Projects (25 points) - Real ATS prioritize experience keywords
  const expMentions =
    (textLower.match(/experience|work history|employment|project|application|system/g) || []).length;

  const projectsScore =
    expMentions > 0
      ? Math.min(25, expMentions * 3)
      : 5;

  // 3. Formatting & Structure (15 points)
  const foundSections = SECTION_KEYWORDS.filter((sec) =>
    textLower.includes(sec),
  );

  const formattingScore = Math.round(
    (foundSections.length / SECTION_KEYWORDS.length) * 15,
  );

  // 4. Achievements & Metrics (15 points) - Looking for quantified results
  const achievementMatches =
    (textLower.match(/\d+%|\d+x|\$[\d,]+|\d+ users|\d+ million|\d+k/g) || []).length;

  const achievementsScore = Math.min(
    15,
    achievementMatches * 3,
  );

  // 5. Grammar & Impact (10 points) - Strong verbs vs weak phrases
  const strongVerbCount = STRONG_ACTION_VERBS.filter((verb) =>
    textLower.includes(verb),
  ).length;

  const weakPhraseCount = WEAK_PHRASES.filter((phrase) =>
    textLower.includes(phrase),
  ).length;

  const grammarScore = Math.max(
    0,
    Math.min(10, strongVerbCount * 2 - weakPhraseCount * 2),
  );

  // Total Score
  const totalScore =
    skillsScore +
    projectsScore +
    formattingScore +
    achievementsScore +
    grammarScore;

  // Weaknesses
  const weaknesses = [];

  if (skillsScore < 20) {
    weaknesses.push("Low skill match for target role (Keyword deficiency)");
  }

  if (projectsScore < 12) {
    weaknesses.push("Weak or insufficient experience/project descriptions");
  }

  if (formattingScore < 10) {
    weaknesses.push("Poor resume structure (Missing standard sections)");
  }

  if (achievementsScore < 8) {
    weaknesses.push("Missing quantified achievements (Needs more numbers/metrics)");
  }

  if (grammarScore < 5) {
    weaknesses.push("Weak action verbs or passive phrasing used");
  }

  return {
    totalScore: Math.min(100, totalScore),
    foundSkills: [...foundCoreSkills, ...foundBonusSkills],
    missingSkills,
    missingBonusSkills,
    weaknesses,

    scoreBreakdown: {
      skills: skillsScore,
      projects: projectsScore,
      formatting: formattingScore,
      achievements: achievementsScore,
      grammar: grammarScore,
    },
  };
};

// AI Prompt
const buildPrompt = (
  resumeText,
  targetRole,
  atsScore,
  weaknesses,
  missingSkills,
) => {
  return `
You are an expert ATS Resume Analyzer.

Analyze this resume for the role "${targetRole}".

Find 2 to 3 weak, generic bullet points in the resume's experience or projects sections. Rewrite them into strong, ATS-friendly bullet points using action verbs and quantified achievements.

Resume:
${resumeText.substring(0, 3000)}

ATS Score: ${atsScore}

Weaknesses:
${weaknesses.join(", ")}

Missing Skills:
${missingSkills.join(", ")}

Return JSON only in this format:

{
  "recommendations": [],
  "recruiterFeedback": "",
  "improvedScorePrediction": 0,
  "bulletPointRewrites": [
    {
      "original": "...",
      "rewritten": "...",
      "explanation": "..."
    }
  ]
}
`;
};

// OpenAI Analysis
const getOpenAIAnalysis = async (prompt) => {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const response =
    await openai.chat.completions.create({
      model: "gpt-3.5-turbo",

      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],

      temperature: 0.7,
    });

  const content =
    response.choices[0].message.content;

  return JSON.parse(
    content.replace(/```json|```/g, "").trim(),
  );
};

// Fallback Analysis
const getFallbackAnalysis = (
  targetRole,
  missingSkills,
  atsScore,
) => {
  return {
    recommendations: [
      `Add missing skills like ${missingSkills
        .slice(0, 3)
        .join(", ")}`,

      "Use quantified achievements",

      "Improve project descriptions",

      `Add more ${targetRole} projects`,
    ],

    recruiterFeedback: `Resume has potential for ${targetRole} role but needs stronger technical presentation and measurable achievements.`,

    improvedScorePrediction: Math.min(
      atsScore + 20,
      95,
    ),
    
    bulletPointRewrites: [
      {
        original: "Worked on frontend tickets",
        rewritten: "Developed and shipped 15+ complex React components, reducing bug resolution time by 30%",
        explanation: "Quantifies the work and uses strong action verbs instead of passive phrases."
      }
    ]
  };
};

// Analyze Resume
analysisApp.post(
  "/analyze/:resumeId",
  verifyToken,
  async (req, res) => {
    try {
      const { resumeId } = req.params;
      const { targetRole } = req.body;

      // Find Resume
      const resume = await Resume.findOne({
        _id: resumeId,
        userId: req.user._id,
      });

      // Resume Not Found
      if (!resume) {
        return res.status(404).json({
          success: false,
          message: "Resume not found",
        });
      }

      // Update Target Role if provided
      if (targetRole && targetRole !== resume.targetRole) {
        const allowedRoles = Object.keys(ROLE_SKILLS);
        if (allowedRoles.includes(targetRole)) {
          resume.targetRole = targetRole;
          await resume.save();
        }
      }

      // Invalid Resume Text
      if (
        !resume.parsedText ||
        resume.parsedText.trim().length < 50
      ) {
        return res.status(400).json({
          success: false,
          message: "Resume text too short",
        });
      }

      // ATS Analysis
      const {
        totalScore,
        scoreBreakdown,
        missingSkills,
        missingBonusSkills,
        weaknesses,
      } = calculateATSScore(
        resume.parsedText,
        resume.targetRole,
      );

      // Build AI Prompt
      const prompt = buildPrompt(
        resume.parsedText,
        resume.targetRole,
        totalScore,
        weaknesses,
        missingSkills,
      );

      let aiResult;

      try {
        // OpenAI Analysis
        if (process.env.OPENAI_API_KEY) {
          aiResult = await getOpenAIAnalysis(
            prompt,
          );
        } else {
          aiResult = getFallbackAnalysis(
            resume.targetRole,
            missingSkills,
            totalScore,
          );
        }
      } catch (err) {
        aiResult = getFallbackAnalysis(
          resume.targetRole,
          missingSkills,
          totalScore,
        );
      }

      // Save Analysis
      const analysis =
        await Analysis.findOneAndUpdate(
          {
            resumeId: resume._id,
          },

          {
            resumeId: resume._id,

            atsScore: totalScore,

            weaknesses,

            missingSkills,
            
            missingBonusSkills,

            recommendations:
              aiResult.recommendations,

            bulletPointRewrites:
              aiResult.bulletPointRewrites || [],

            recruiterFeedback:
              aiResult.recruiterFeedback,

            improvedScorePrediction:
              aiResult.improvedScorePrediction,

            scoreBreakdown,
          },

          {
            new: true,
            upsert: true,
          },
        );

      // Response
      res.status(200).json({
        success: true,
        message: "Resume analyzed successfully",

        payload: analysis,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  },
);

// Get Analysis
analysisApp.get(
  "/:resumeId",
  verifyToken,
  async (req, res) => {
    try {
      const { resumeId } = req.params;

      // Find Analysis
      const analysis =
        await Analysis.findOne({
          resumeId,
        }).populate(
          "resumeId",
          "originalFileName targetRole",
        );

      // Analysis Not Found
      if (!analysis) {
        return res.status(404).json({
          success: false,
          message: "Analysis not found",
        });
      }

      // Response
      res.status(200).json({
        success: true,
        message: "Analysis fetched successfully",

        payload: analysis,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  },
);

// Add Skill to Resume
analysisApp.post(
  "/:resumeId/add-skill",
  verifyToken,
  async (req, res) => {
    try {
      const { resumeId } = req.params;
      const { skill } = req.body;

      if (!skill || skill.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: "Skill cannot be empty",
        });
      }

      // Find Resume
      const resume = await Resume.findOne({
        _id: resumeId,
        userId: req.user._id,
      });

      if (!resume) {
        return res.status(404).json({
          success: false,
          message: "Resume not found",
        });
      }

      // Add skill to parsed text
      const skillSection = `\n\nTechnical Skills: ${skill}`;
      resume.parsedText += skillSection;
      await resume.save();

      // Re-calculate ATS score
      const {
        totalScore,
        scoreBreakdown,
        missingSkills,
        missingBonusSkills,
        weaknesses,
      } = calculateATSScore(
        resume.parsedText,
        resume.targetRole,
      );

      // Update analysis
      const analysis = await Analysis.findOneAndUpdate(
        { resumeId: resume._id },
        {
          atsScore: totalScore,
          scoreBreakdown,
          missingSkills,
          missingBonusSkills,
          weaknesses,
          improvedScorePrediction: Math.min(100, totalScore + 5),
        },
        { new: true }
      );

      res.status(200).json({
        success: true,
        message: `Skill "${skill}" added successfully. ATS Score updated!`,
        payload: {
          newScore: totalScore,
          analysis,
        },
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  },
);