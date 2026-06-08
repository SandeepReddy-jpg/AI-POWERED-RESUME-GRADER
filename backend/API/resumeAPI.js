import exp from "express";
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import mammoth from "mammoth";
import verifyToken from "../middleware/verifyToken.js";
import uploadResume from "../middleware/upload.js";
import Resume from "../Model/resumeModel.js";
import Analysis from "../Model/analysisModel.js";
import { uploadBufferToCloudinary } from "../config/cloudinaryUpload.js";
import cloudinary from "../config/cloudinary.js";

export const resumeApp = exp.Router();

//Extract text from file buffer
const extractTextFromFile = async (buffer, mimetype) => {
  try {
    //PDF file
    if (mimetype === "application/pdf") {
      const pdfData = await pdfParse(buffer);
      return pdfData.text || "";
    }
    //DOCX file
    const result = await mammoth.extractRawText({ buffer });
    return result.value || "";
  } catch (err) {
    console.log("Text extraction error:", err.message);
    return "";
  }
};

//Upload resume
resumeApp.post(
  "/upload",
  verifyToken,
  uploadResume,
  async (req, res, next) => {
    //track cloudinary result so we can rollback if DB save fails
    let cloudinaryResult = null;
    try {
      const { targetRole } = req.body;
      const file = req.file;

      //validate target role
      const allowedRoles = [
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
      ];
      if (!targetRole || !allowedRoles.includes(targetRole)) {
        return res.status(400).json({
          message: `Invalid target role. Allowed: ${allowedRoles.join(", ")}`,
        });
      }

      //extract text from buffer before uploading
      const parsedText = await extractTextFromFile(file.buffer, file.mimetype);

      //reject if text could not be extracted — analysis will be useless without it
      if (!parsedText || parsedText.trim().length < 50) {
        return res.status(422).json({
          message:
            "Could not extract text from file. Try a plain (non-scanned, non-password-protected) PDF or DOCX.",
        });
      }

      //upload file buffer to cloudinary BEFORE writing to DB
      //resource_type "raw" is required for non-image files (PDF, DOCX)
      cloudinaryResult = await uploadBufferToCloudinary(
        file.buffer,
        "resume_analyzer/resumes",
      );

      //determine file type
      const fileType =
        file.mimetype === "application/pdf" ? "pdf" : "docx";

      //FIX 1: verifyToken signs JWT as { id: user._id }
      //so decoded payload has .id (string), NOT ._id
      //using req.user._id gives undefined → userId stored as undefined in DB
      const userId = req.user.id;

      //FIX 2: field names must exactly match resumeModel schema
      //schema has: userId, resumeUrl, cloudinaryPublicId, originalFileName, parsedText, targetRole, fileType
      //schema uses strict:"throw" — any unknown field throws StrictModeError immediately
      //WRONG (old code): fileData: file.buffer, fileMimeType: file.mimetype  ← not in schema, throws
      //WRONG (old code): userId: req.user._id  ← undefined, breaks ownership queries
      const resumeDocument = new Resume({
        userId,
        resumeUrl: cloudinaryResult.secure_url,
        cloudinaryPublicId: cloudinaryResult.public_id,
        originalFileName: file.originalname,
        parsedText,
        targetRole,
        fileType,
      });

      await resumeDocument.save();

      res.status(201).json({
        message: "Resume uploaded successfully",
        payload: {
          id: resumeDocument._id,
          originalFileName: resumeDocument.originalFileName,
          resumeUrl: resumeDocument.resumeUrl,
          targetRole: resumeDocument.targetRole,
          fileType: resumeDocument.fileType,
          createdAt: resumeDocument.createdAt,
        },
      });
    } catch (err) {
      //FIX 3: if DB save fails after cloudinary upload succeeded
      //the file would be an orphan in cloudinary — delete it to keep storage clean
      if (cloudinaryResult?.public_id) {
        await cloudinary.uploader
          .destroy(cloudinaryResult.public_id, { resource_type: "raw" })
          .catch((e) => console.log("Cloudinary rollback failed:", e.message));
      }
      next(err);
    }
  },
);

//Get all resumes of logged-in user
resumeApp.get("/all", verifyToken, async (req, res, next) => {
  try {
    const userId = req.user.id;

    //exclude parsedText from list — can be very large
    const resumesList = await Resume
      .find({ userId })
      .sort({ createdAt: -1 })
      .select("-parsedText");

    res.status(200).json({
      message: "Resumes fetched successfully",
      count: resumesList.length,
      payload: resumesList,
    });
  } catch (err) {
    next(err);
  }
});

//Get single resume by ID
resumeApp.get("/:id", verifyToken, async (req, res, next) => {
  try {
    const userId = req.user.id;

    //ownership check: _id + userId must both match
    const resumeDocument = await Resume.findOne({
      _id: req.params.id,
      userId,
    });

    if (!resumeDocument) {
      return res.status(404).json({ message: "Resume not found" });
    }

    res.status(200).json({
      message: "Resume fetched successfully",
      payload: resumeDocument,
    });
  } catch (err) {
    next(err);
  }
});

//Delete resume by ID
resumeApp.delete("/:id", verifyToken, async (req, res, next) => {
  try {
    const userId = req.user.id;

    //ownership check
    const resumeDocument = await Resume.findOne({
      _id: req.params.id,
      userId,
    });

    if (!resumeDocument) {
      return res.status(404).json({ message: "Resume not found" });
    }

    //delete file from cloudinary (resource_type raw — required for PDF/DOCX)
    if (resumeDocument.cloudinaryPublicId) {
      await cloudinary.uploader
        .destroy(resumeDocument.cloudinaryPublicId, { resource_type: "raw" })
        .catch((e) => console.log("Cloudinary delete warning:", e.message));
    }

    //delete related analysis to avoid orphan documents
    await Analysis.deleteOne({ resumeId: resumeDocument._id });

    //delete resume from DB
    await Resume.deleteOne({ _id: resumeDocument._id });

    res.status(200).json({ message: "Resume deleted successfully" });
  } catch (err) {
    next(err);
  }
});

// Update resume by adding skills
resumeApp.put("/:id/skills", verifyToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { skills } = req.body;

    if (!skills || !Array.isArray(skills)) {
      return res.status(400).json({ message: "Skills array is required" });
    }

    // ownership check
    const resumeDocument = await Resume.findOne({
      _id: req.params.id,
      userId,
    });

    if (!resumeDocument) {
      return res.status(404).json({ message: "Resume not found" });
    }

    // Append skills to the parsedText so the ATS analyzer picks them up
    // We add some whitespace to ensure it's treated as separate keywords
    const skillsText = `\n\n[ADDED SKILLS: ${skills.join(", ")}]\n\n`;
    resumeDocument.parsedText += skillsText;

    await resumeDocument.save();

    res.status(200).json({ message: "Skills added successfully", payload: resumeDocument });
  } catch (err) {
    next(err);
  }
});

// Update resume by overwriting text manually
resumeApp.put("/:id/text", verifyToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { parsedText } = req.body;

    if (parsedText === undefined || parsedText === null) {
      return res.status(400).json({ message: "Parsed text is required" });
    }

    // ownership check
    const resumeDocument = await Resume.findOne({
      _id: req.params.id,
      userId,
    });

    if (!resumeDocument) {
      return res.status(404).json({ message: "Resume not found" });
    }

    resumeDocument.parsedText = parsedText;

    await resumeDocument.save();

    res.status(200).json({ message: "Text updated successfully", payload: resumeDocument });
  } catch (err) {
    next(err);
  }
});

// Update resume content and trigger re-analysis
resumeApp.post("/:id/update-content", verifyToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ 
        success: false,
        message: "Content cannot be empty" 
      });
    }

    // Ownership check
    const resumeDocument = await Resume.findOne({
      _id: req.params.id,
      userId,
    });

    if (!resumeDocument) {
      return res.status(404).json({ 
        success: false,
        message: "Resume not found" 
      });
    }

    // Update parsed text
    resumeDocument.parsedText = content;
    await resumeDocument.save();

    // Delete old analysis so new one will be generated on next fetch
    await Analysis.deleteOne({ resumeId: resumeDocument._id });

    res.status(200).json({ 
      success: true,
      message: "Resume content updated successfully. Re-analyze to see updated scores.",
      payload: {
        id: resumeDocument._id,
        title: resumeDocument.title,
        originalFileName: resumeDocument.originalFileName,
        parsedText: resumeDocument.parsedText,
      }
    });
  } catch (err) {
    next(err);
  }
});