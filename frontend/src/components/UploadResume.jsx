import { useForm } from "react-hook-form";
import { useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router";
import {
  formGroup,
  labelClass,
  inputClass,
  errorClass,
  loadingClass,
} from "../styles/common";
import BASE_URL from "../config/api";


function UploadResume() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  //submit resume upload
  const onUploadResume = async (formData) => {
    setLoading(true);
    setApiError(null);
    //build FormData object (file upload needs multipart)
    const data = new FormData();
    data.append("resume", formData.resume[0]);
    data.append("targetRole", formData.targetRole);

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(`${BASE_URL}/resume/upload`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      if (res.status === 201) {
        toast.success("Resume uploaded successfully!");
        reset();
        navigate("/profile/resumes");
      }
    } catch (err) {
      setApiError(err.response?.data?.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <p className={loadingClass}>Uploading and parsing resume...</p>;
  }

  return (
    <div className="bg-white border border-[#e8e3dc] rounded-3xl p-10 shadow-sm max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-[#1a1a2e] tracking-tight text-center mb-8">Upload Your Resume</h2>

      {/* API Error */}
      {apiError && <p className={`${errorClass} mb-4`}>{apiError}</p>}

      <form onSubmit={handleSubmit(onUploadResume)}>
        {/* TARGET ROLE */}
        <div className={formGroup}>
          <label className={labelClass}>Target Role</label>
          <select
            className={inputClass}
            {...register("targetRole", {
              required: "Please select a target role",
            })}
          >
            <option value="">Select your target role</option>
            <option value="Frontend Developer">Frontend Developer</option>
            <option value="Backend Developer">Backend Developer</option>
            <option value="Full Stack Developer">Full Stack Developer</option>
            <option value="Data Analyst">Data Analyst</option>
            <option value="Data Scientist">Data Scientist</option>
            <option value="DevOps Engineer">DevOps Engineer</option>
            <option value="Product Manager">Product Manager</option>
            <option value="UI/UX Designer">UI/UX Designer</option>
            <option value="Mobile Developer">Mobile Developer</option>
            <option value="QA Engineer">QA Engineer</option>
          </select>
          {errors.targetRole && (
            <p className={`${errorClass} mt-1`}>{errors.targetRole.message}</p>
          )}
        </div>

        {/* RESUME FILE */}
        <div className={formGroup}>
          <label className={labelClass}>Resume File (PDF or DOCX, max 5MB)</label>
          <input
            type="file"
            accept=".pdf,.docx"
            className={inputClass}
            {...register("resume", {
              required: "Please select a resume file",
              validate: {
                fileType: (files) => {
                  if (!files?.[0]) return true;
                  const allowed = [
                    "application/pdf",
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                  ];
                  return (
                    allowed.includes(files[0].type) || "Only PDF and DOCX allowed"
                  );
                },
                fileSize: (files) => {
                  if (!files?.[0]) return true;
                  return (
                    files[0].size <= 5 * 1024 * 1024 || "File size must be under 5MB"
                  );
                },
              },
            })}
          />
          {errors.resume && (
            <p className={`${errorClass} mt-1`}>{errors.resume.message}</p>
          )}
        </div>

        {/* SUBMIT */}
        <button
          type="submit"
          className="w-full bg-[#6c63ff] text-white font-semibold py-3 rounded-xl hover:bg-[#5548e0] hover:shadow-lg hover:shadow-[#6c63ff]/25 transition-all duration-200 text-sm"
          disabled={loading}
        >
          {loading ? "Uploading..." : "Upload Resume"}
        </button>
      </form>
    </div>
  );
}

export default UploadResume;
