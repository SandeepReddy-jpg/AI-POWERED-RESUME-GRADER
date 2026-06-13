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
  resumeText = ""
) => {
  const lines = resumeText.split("\n").map(l => l.trim()).filter(Boolean);
  const weakActionVerbs = ["helped", "assisted", "worked", "responsible", "handled", "managed", "support", "tested", "wrote", "did"];
  
  // Identify candidate weak bullet points in the resume
  const candidateBullets = lines.filter(line => {
    const clean = line.replace(/^[-•·*0-9.]\s*/, "").trim();
    const hasWeakVerb = weakActionVerbs.some(verb => clean.toLowerCase().includes(verb));
    const noMetrics = !/\d+%|\d+x|\$[\d,]+|\d+ users|\d+ million|\d+k/i.test(clean);
    return clean.length > 25 && clean.length < 160 && hasWeakVerb && noMetrics;
  });

  const selectedBullet = candidateBullets[0] || lines.find(l => l.length > 35 && l.length < 140) || "Worked on backend tickets and handled server tasks.";
  const cleanOriginal = selectedBullet.replace(/^[-•·*0-9.]\s*/, "").trim();

  // Custom role-based rewrites
  const rewrites = {
    "Frontend Developer": {
      rewritten: "Engineered and deployed 12+ responsive user interfaces using React and Tailwind CSS, improving page load speed by 35% and user engagement by 18%.",
      explanation: "Swapped passive description with strong impact-driven action verbs (Engineered, Deployed) and added measurable performance metrics."
    },
    "Backend Developer": {
      rewritten: "Architected and optimized scalable REST APIs using Node.js and Express, reducing server response times by 40% and supporting over 10,000 daily active users.",
      explanation: "Shows technical ownership (Architected, Optimized) and introduces key API scalability metrics."
    },
    "Full Stack Developer": {
      rewritten: "Led full-lifecycle development of 3 web applications utilizing the MERN stack, resulting in a 25% increase in operational efficiency and 99.9% uptime.",
      explanation: "Demonstrates end-to-end fullstack ownership with performance and availability metrics."
    },
    "Data Analyst": {
      rewritten: "Developed interactive Tableau dashboards and automated ETL pipelines, saving the analytics team 12+ weekly hours and improving data reporting accuracy by 22%.",
      explanation: "Details the specific tool stack (Tableau, ETL) and quantifies time-savings and data accuracy improvements."
    },
    "Data Scientist": {
      rewritten: "Built and tuned predictive machine learning models using Python and Scikit-Learn, increasing classification precision by 15% and saving $45K in operational costs.",
      explanation: "Highlights machine learning skill application and attaches clear financial and accuracy metrics."
    },
    "DevOps Engineer": {
      rewritten: "Containerized applications with Docker and established automated CI/CD pipelines in GitHub Actions, reducing deployment time by 60% and configuration errors by 80%.",
      explanation: "Focuses on modernization and quantifies release speedups and reliability improvements."
    },
    "Product Manager": {
      rewritten: "Managed product roadmap and prioritized backlog across a 6-person engineering team, delivering 4 key features on schedule and increasing NPS score by 14 points.",
      explanation: "Emphasizes team coordination and user feedback metrics (NPS, on-schedule delivery)."
    },
    "UI/UX Designer": {
      rewritten: "Designed comprehensive user journeys and high-fidelity Figma prototypes, reducing user drop-off rate by 28% and increasing registration conversions by 15%.",
      explanation: "Uses designer-specific terminology and links design choices directly to business conversion metrics."
    },
    "Mobile Developer": {
      rewritten: "Engineered and published 2 cross-platform React Native apps, achieving a 4.8 star store rating and supporting 50K+ downloads.",
      explanation: "Demonstrates public release experience and uses store ratings and downloads as strong evidence of quality."
    },
    "QA Engineer": {
      rewritten: "Authored automated Selenium test suites, increasing regression test coverage from 45% to 92% and preventing 30+ critical production bugs.",
      explanation: "Quantifies test coverage improvement and highlights preventative QA impact."
    }
  };

  const roleRewrite = rewrites[targetRole] || {
    rewritten: "Spearheaded execution of high-impact technical initiatives, boosting system throughput by 25% and reducing operational overhead.",
    explanation: "Replaced passive description with quantitative delivery and action verbs."
  };

  const recs = [];
  
  if (missingSkills.length > 0) {
    recs.push(`Quick-add the missing core skills: ${missingSkills.slice(0, 4).join(", ")} directly from the report.`);
  }
  recs.push("Quantify achievements: Add numbers, percentages, or dollar values to showcase measurable impact.");
  recs.push("Begin experience and project bullet points with action verbs (e.g. Spearheaded, Engineered).");
  recs.push("Improve structural layout using one of our modern, professionally designed templates.");

  let feedback = `Your resume matches ${Math.round(atsScore)}% of typical requirements for a ${targetRole}. `;
  if (atsScore < 50) {
    feedback += "The formatting is fine, but it severely lacks technical keywords and measurable achievements. Highlight specific tools used and quantify your impact.";
  } else if (atsScore < 75) {
    feedback += "Good foundation. To stand out, replace passive verbs with executive action verbs and focus more on the outcome of your projects rather than just tasks.";
  } else {
    feedback += "Excellent resume with great keyword match and clear structure. Double-check formatting consistency and template layout before submitting.";
  }

  return {
    recommendations: recs,
    recruiterFeedback: feedback,
    improvedScorePrediction: Math.min(atsScore + 15, 98),
    bulletPointRewrites: [
      {
        original: selectedBullet,
        rewritten: roleRewrite.rewritten,
        explanation: roleRewrite.explanation
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
            resume.parsedText,
          );
        }
      } catch (err) {
        aiResult = getFallbackAnalysis(
          resume.targetRole,
          missingSkills,
          totalScore,
          resume.parsedText,
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

      await analysis.populate(
        "resumeId",
        "originalFileName targetRole resumeUrl parsedText",
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
          "originalFileName targetRole resumeUrl parsedText",
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

// Fallback generator for section enhancement if no OpenAI API key is present
const getFallbackEnhancement = (section, content, targetRole) => {
  if (section === "summary") {
    return `Results-driven and highly motivated ${targetRole} with a strong foundation in modern software engineering principles and data-driven problem solving. Experienced in designing, developing, and deploying scalable applications while optimizing performance. Proven track record of collaborating in fast-paced teams to deliver high-quality, ATS-optimized solutions that drive business value.`;
  }
  if (section === "skills") {
    const roleConfig = ROLE_SKILLS[targetRole] || { core: [], bonus: [] };
    const existing = content.split(/[,\n]/).map(s => s.trim()).filter(Boolean);
    const added = [...roleConfig.core.slice(0, 5), ...roleConfig.bonus.slice(0, 5)];
    const allSkills = [...new Set([...existing, ...added])];
    return allSkills.join(", ");
  }
  if (section === "experience" || section === "projects") {
    const lines = content.split("\n");
    return lines.map(line => {
      const trimmed = line.trim();
      if (!trimmed) return "";
      // If it looks like a bullet point or list item, enhance it
      if (trimmed.startsWith("•") || trimmed.startsWith("-") || trimmed.startsWith("*")) {
        const bulletText = trimmed.replace(/^[-•*]\s*/, "");
        if (bulletText.toLowerCase().includes("develop") || bulletText.toLowerCase().includes("built")) {
          return `• Spearheaded development of core features, boosting user engagement by 25% and reducing load times by 40%`;
        }
        if (bulletText.toLowerCase().includes("test") || bulletText.toLowerCase().includes("bug")) {
          return `• Automated end-to-end testing protocols, achieving 90%+ test coverage and reducing production bugs by 35%`;
        }
        return `• Optimized workflow processes and implemented best practices to improve system efficiency by 15%`;
      }
      return trimmed;
    }).filter(Boolean).join("\n");
  }
  return content;
};

// AI Enhance section route
analysisApp.post(
  "/:resumeId/enhance-section",
  verifyToken,
  async (req, res) => {
    try {
      const { resumeId } = req.params;
      const { section, content } = req.body;

      if (!section || !content || content.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: "Section and content are required",
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

      const targetRole = resume.targetRole || "Professional";

      // Build prompts
      const systemPrompt = "You are an expert resume writer and ATS optimization engine.";
      let userPrompt = "";

      if (section === "contact") {
        userPrompt = `Clean up and format this contact information section for a resume. Make sure it is standard, readable, and professional. Do not add any conversational text or explanation. Only return the cleaned contact details.
Content to clean:
${content}`;
      } else if (section === "summary") {
        userPrompt = `Rewrite this professional summary to be a compelling, 3-sentence, ATS-optimized summary highlighting key technical achievements and strengths for a "${targetRole}" role. Do not add any conversational text or explanation. Only return the rewritten summary.
Content to rewrite:
${content}`;
      } else if (section === "experience") {
        userPrompt = `Enhance this professional experience entry for a "${targetRole}" role. Retain the same core jobs and responsibilities, but rewrite all bullet points to start with strong action verbs and include quantifiable metrics, business impact, or tech stack where possible. Do not add any conversational text or explanation. Only return the rewritten experience block (preserving standard titles and bullets).
Content to enhance:
${content}`;
      } else if (section === "skills") {
        userPrompt = `Suggest an optimized, comma-separated list of technical skills for a "${targetRole}" role, starting with the user's current skills: ${content}. Add highly relevant standard industry technical skills that would boost their ATS match score for a "${targetRole}". Return ONLY the technical skills as a comma-separated list. No numbering, no introduction.`;
      } else if (section === "education") {
        userPrompt = `Format this education section clearly and professionally. Ensure degree, institution, location, dates, and GPA/CGPA are clear. Do not add any conversational text or explanation. Only return the formatted education block.
Content to format:
${content}`;
      } else if (section === "projects") {
        userPrompt = `Enhance this project entry for a "${targetRole}" role. Rewrite descriptions to be strong, impact-driven bullet points showcasing technologies used, key problems solved, and results achieved. Do not add any conversational text or explanation. Only return the rewritten project block.
Content to enhance:
${content}`;
      } else if (section === "certifications") {
        userPrompt = `Format this certifications/licenses section professionally. Do not add any conversational text or explanation. Only return the formatted certifications block.
Content to format:
${content}`;
      } else {
        userPrompt = `Enhance and optimize this section for a "${targetRole}" resume:
${content}`;
      }

      let enhancedText = "";

      if (process.env.OPENAI_API_KEY) {
        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });

        const response = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.7,
        });

        enhancedText = response.choices[0].message.content.trim();
      } else {
        enhancedText = getFallbackEnhancement(section, content, targetRole);
      }

      res.status(200).json({
        success: true,
        data: {
          enhanced: enhancedText,
        },
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }
);