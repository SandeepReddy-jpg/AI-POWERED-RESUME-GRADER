import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  pageWrapper,
  headingClass,
  bodyText,
  primaryBtn,
  tagClass,
  loadingClass,
  errorClass,
  divider,
  timestampClass,
} from "../styles/common";

const BASE_URL = "http://localhost:4000/api";

function ResumeDetail() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [resume, setResume] = useState(location.state || null);
  const [selectedRole, setSelectedRole] = useState(location.state?.targetRole || "");
  const [loading, setLoading] = useState(!location.state);
  const [error, setError] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [isEditingText, setIsEditingText] = useState(false);
  const [editedText, setEditedText] = useState("");
  const [savingText, setSavingText] = useState(false);

  useEffect(() => {
    if (resume?.parsedText && !editedText) {
      setEditedText(resume.parsedText);
    }
  }, [resume?.parsedText, editedText]);

  //fetch resume if not passed via state
  useEffect(() => {
    if (resume) return;
    const getResume = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${BASE_URL}/resume/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 200) {
          setResume(res.data.payload);
          setSelectedRole(res.data.payload.targetRole);
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load resume");
      } finally {
        setLoading(false);
      }
    };
    getResume();
  }, [id, resume]);

  //trigger AI analysis
  const onAnalyze = async () => {
    setAnalyzing(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${BASE_URL}/analysis/analyze/${id}`, { targetRole: selectedRole }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Analysis complete!");
      navigate(`/analysis/${id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSaveText = async () => {
    setSavingText(true);
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${BASE_URL}/resume/${id}/text`, { parsedText: editedText }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Document saved successfully!");
      setResume({ ...resume, parsedText: editedText });
      setIsEditingText(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save text");
    } finally {
      setSavingText(false);
    }
  };

  const handleSaveAndAnalyze = async () => {
    setSavingText(true);
    try {
      const token = localStorage.getItem("token");
      // save
      await axios.put(`${BASE_URL}/resume/${id}/text`, { parsedText: editedText }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // analyze
      await axios.post(`${BASE_URL}/analysis/analyze/${id}`, { targetRole: selectedRole }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Document saved and analyzed!");
      setResume({ ...resume, parsedText: editedText });
      setIsEditingText(false);
      navigate(`/analysis/${id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save and analyze");
    } finally {
      setSavingText(false);
    }
  };

  //view existing analysis
  const onViewAnalysis = () => {
    navigate(`/analysis/${id}`);
  };

  //format date IST
  const formatDate = (date) => {
    return new Date(date).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "long",
      timeStyle: "short",
    });
  };

  if (loading) {
    return <p className={loadingClass}>Loading resume...</p>;
  }

  if (error) {
    return <p className={errorClass}>{error}</p>;
  }

  return (
    <div className={pageWrapper}>
      {/* HEADER */}
      <div className="mb-8 flex flex-col gap-3">
        <p className={tagClass}>{resume?.targetRole}</p>
        <h1 className={headingClass}>{resume?.originalFileName}</h1>
        <p className={`${timestampClass}`}>
          Uploaded {formatDate(resume?.createdAt)}
        </p>
      </div>

      <div className={divider}></div>

      {/* DETAILS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 my-8">
        <div>
          <p className="text-xs font-medium text-[#9e9aa7] uppercase tracking-widest mb-1">
            File Type
          </p>
          <p className="text-sm font-semibold text-[#1a1a2e] uppercase">
            {resume?.fileType}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-[#9e9aa7] uppercase tracking-widest mb-1">
            Target Role (Editable for Analysis)
          </p>
          <select 
            value={selectedRole} 
            onChange={(e) => setSelectedRole(e.target.value)}
            className="text-sm font-semibold text-[#1a1a2e] bg-[#f4f1ee] border border-[#e8e3dc] rounded-lg px-2 py-1 outline-none focus:border-[#6c63ff]"
          >
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
        </div>
        <div>
          <p className="text-xs font-medium text-[#9e9aa7] uppercase tracking-widest mb-1">
            Resume File
          </p>
          <a
            href={resume?.resumeUrl}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-[#6c63ff] hover:text-[#5548e0] transition"
          >
            View on Cloudinary →
          </a>
        </div>
      </div>

      {/* PARSED TEXT PREVIEW OR EDITOR */}
      {resume?.parsedText && (
        <div className="bg-[#f9f6f2] rounded-2xl p-6 mb-8 border border-[#e8e3dc] focus-within:border-[#6c63ff]/30 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-[#9e9aa7] uppercase tracking-widest">
              {isEditingText ? "Document Editor" : "Extracted Text Preview"}
            </p>
            {!isEditingText && (
              <button 
                onClick={() => setIsEditingText(true)}
                className="text-xs font-bold text-[#6c63ff] hover:text-[#5548e0] transition"
              >
                Edit Document
              </button>
            )}
          </div>
          
          {isEditingText ? (
            <div className="flex flex-col gap-4">
              <textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                rows={12}
                className="w-full text-sm leading-relaxed p-4 rounded-xl border border-[#e8e3dc] focus:border-[#6c63ff] focus:ring-1 focus:ring-[#6c63ff] outline-none font-mono resize-y bg-white"
              />
              <div className="flex items-center gap-3 justify-end">
                <button
                  onClick={() => {
                    setIsEditingText(false);
                    setEditedText(resume.parsedText);
                  }}
                  className="text-sm font-medium text-[#9e9aa7] hover:text-[#1a1a2e] px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveText}
                  disabled={savingText}
                  className="bg-white border border-[#e8e3dc] text-[#1a1a2e] text-sm font-medium px-4 py-2 rounded-lg shadow-sm hover:bg-[#f4f1ee] transition"
                >
                  {savingText ? "Saving..." : "Save Text"}
                </button>
                <button
                  onClick={handleSaveAndAnalyze}
                  disabled={savingText}
                  className="bg-[#6c63ff] text-white text-sm font-bold px-5 py-2 rounded-lg shadow-md hover:bg-[#5548e0] hover:shadow-lg transition"
                >
                  {savingText ? "Saving..." : "Save & Evaluate"}
                </button>
              </div>
            </div>
          ) : (
            <div className="relative group cursor-pointer" onClick={() => setIsEditingText(true)}>
              <p className={`${bodyText} text-sm leading-relaxed line-clamp-6`}>
                {resume.parsedText.substring(0, 600)}
                {resume.parsedText.length > 600 && "..."}
              </p>
              <div className="absolute inset-0 bg-[#f9f6f2]/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                <span className="bg-white text-[#1a1a2e] px-4 py-2 rounded-full font-bold shadow-md text-sm">
                  Click to Edit
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      <div className={divider}></div>

      {/* ACTIONS */}
      <div className="flex gap-3 mt-6">
        <button
          className={primaryBtn}
          onClick={onAnalyze}
          disabled={analyzing}
        >
          {analyzing ? "Analyzing..." : "Run AI Analysis"}
        </button>
        <button
          className="bg-[#6c63ff] text-white font-medium px-5 py-2 rounded-full hover:bg-[#5548e0] transition-colors cursor-pointer text-sm"
          onClick={() => navigate(`/job-match/${id}`)}
        >
          🎯 Match Job
        </button>
        <button className="border border-[#e8e3dc] text-[#1a1a2e] font-medium px-5 py-2 rounded-full hover:bg-[#f4f1ee] transition-colors cursor-pointer text-sm" onClick={onViewAnalysis}>
          View Existing Analysis
        </button>
        <button
          className="text-[#9e9aa7] text-sm hover:text-[#1a1a2e] transition cursor-pointer"
          onClick={() => navigate(-1)}
        >
          ← Back
        </button>
      </div>
    </div>
  );
}

export default ResumeDetail;
