import multerConfig from "../config/multer.js";
const uploadResume = (req, res, next) => {
  const singleUpload = multerConfig.single("resume"); 

  singleUpload(req, res, (err) => {
    if (err) {
      
      return res.status(400).json({
        success: false,
        message: err.message || "❌ File upload error.",
      });
    }

    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: " No file uploaded. Please attach a PDF or DOCX file.",
      });
    }

    
    next();
  });
};

export default uploadResume;
