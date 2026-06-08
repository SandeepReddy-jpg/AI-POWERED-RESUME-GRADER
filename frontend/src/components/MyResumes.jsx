import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router";
import { toast } from "react-hot-toast";
import {
  resumeGrid,
  resumeCardClass,
  resumeTitle,
  resumeMeta,
  tagClass,
  ghostBtn,
  loadingClass,
  errorClass,
  emptyStateClass,
  timestampClass,
} from "../styles/common";

const BASE_URL = "http://localhost:4000/api";

function MyResumes() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resumes, setResumes] = useState([]);

  //fetch all resumes of logged-in user
  const getResumes = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${BASE_URL}/resume/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 200) {
        setResumes(res.data.payload);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getResumes();
  }, []);

  //delete resume by id
  const onDeleteResume = async (resumeId) => {
    if (!window.confirm("Delete this resume and its analysis?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${BASE_URL}/resume/${resumeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Resume deleted");
      setResumes((prev) => prev.filter((r) => r._id !== resumeId));
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    }
  };

  //navigate to resume detail
  const onViewResume = (resumeObj) => {
    navigate(`/resume/${resumeObj._id}`, { state: resumeObj });
  };

  //format date IST
  const formatDate = (date) => {
    return new Date(date).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium",
    });
  };

  if (loading) {
    return <p className={loadingClass}>Loading resumes...</p>;
  }

  return (
    <div>
      {/* ERROR */}
      {error && <p className={errorClass}>{error}</p>}

      {/* EMPTY STATE */}
      {resumes.length === 0 ? (
        <p className={emptyStateClass}>
          No resumes uploaded yet. Go to{" "}
          <span className="text-[#6c63ff] font-medium">Upload Resume</span> to get started.
        </p>
      ) : (
        <div className={resumeGrid}>
          {resumes.map((resumeObj) => (
            <div className={resumeCardClass} key={resumeObj._id}>
              <div className="flex flex-col h-full gap-2">
                {/* FILE NAME */}
                <p className={resumeTitle}>{resumeObj.originalFileName}</p>

                {/* ROLE TAG */}
                <p className={tagClass}>{resumeObj.targetRole}</p>

                {/* META */}
                <p className={`${resumeMeta} uppercase tracking-wider`}>
                  {resumeObj.fileType}
                </p>

                {/* DATE */}
                <p className={timestampClass}>{formatDate(resumeObj.createdAt)}</p>

                {/* ACTIONS */}
                <div className="flex gap-2 mt-auto pt-3">
                  <button
                    className={ghostBtn}
                    onClick={() => onViewResume(resumeObj)}
                  >
                    View →
                  </button>
                  <button
                    className="text-[#e05252] text-sm font-medium hover:text-[#c93d3d] transition cursor-pointer"
                    onClick={() => onDeleteResume(resumeObj._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyResumes;
