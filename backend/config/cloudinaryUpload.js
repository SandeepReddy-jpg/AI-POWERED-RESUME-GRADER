import cloudinary from "./cloudinary.js";
import streamifier from "streamifier";

// Mock implementation for development/testing
const isMockMode = !process.env.CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY.includes("your_");

export const uploadBufferToCloudinary = (buffer, folder = "resumes", publicId = null) => {
  return new Promise((resolve, reject) => {
    if (isMockMode) {
      // Mock upload - return fake response
      const mockPublicId = publicId || `${folder}/${Date.now()}`;
      console.log("📝 [MOCK] Uploading to Cloudinary (mock mode)");
      resolve({
        public_id: mockPublicId,
        secure_url: `https://res.cloudinary.com/demo/image/upload/${mockPublicId}.pdf`,
        url: `http://res.cloudinary.com/demo/image/upload/${mockPublicId}.pdf`,
        bytes: buffer.length,
      });
      return;
    }

    const options = {
      folder,
      resource_type: "raw", 
    };

    if (publicId) {
      options.public_id = publicId;
    }

    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) {
        reject(new Error(" Cloudinary upload failed: " + error.message));
      } else {
        resolve(result);
      }
    });

    
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

export const deleteFromCloudinary = async (publicId) => {
  if (isMockMode) {
    console.log("📝 [MOCK] Deleting from Cloudinary (mock mode)");
    return { result: "ok" };
  }
  return cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
};
