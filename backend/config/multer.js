import multer from "multer";
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "application/pdf",                                                    
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", 
    "application/msword",                                                 
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true); 
  } else {
    cb(new Error("❌ Only PDF and DOCX files are allowed!"), false); 
  }
};


const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, 
});

export default upload;
