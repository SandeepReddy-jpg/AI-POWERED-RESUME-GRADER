import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { toast } from "react-hot-toast";
import axios from "axios";
import {
  pageWrapper,
  headingClass,
  loadingClass,
  errorClass,
  divider,
  tagClass,
  analysisSectionTitle,
  ghostBtn,
} from "../styles/common";
import BASE_URL from "../config/api";


function EditSkills() {
  const { resumeId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  
  const [analysis, setAnalysis] = useState(null);
  const [selectedSkills, setSelectedSkills] = useState([]);

  // Fetch analysis for this resume
  useEffect(() => {
    const getAnalysis = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${BASE_URL}/analysis/${resumeId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 200) {
          setAnalysis(res.data.payload);
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load analysis");
      } finally {
        setLoading(false);
      }
    };
    getAnalysis();
  }, [resumeId]);

  const toggleSkill = (skill) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const handleSaveAndAnalyze = async () => {
    if (selectedSkills.length === 0) {
      toast.error("Please select at least one skill to add");
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("token");

      // 1. Add skills to the resume's parsed text
      await axios.put(
        `${BASE_URL}/resume/${resumeId}/skills`,
        { skills: selectedSkills },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // 2. Trigger re-analysis
      await axios.post(
        `${BASE_URL}/analysis/analyze/${resumeId}`,
        { targetRole: analysis.resumeId?.targetRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Skills added and resume re-analyzed!");
      
      // Navigate back to the analysis result page
      navigate(`/analysis/${resumeId}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update skills and re-analyze");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className={loadingClass}>Loading missing skills...</p>;
  }

  if (error) {
    return (
      <div className={pageWrapper}>
        <p className={`${errorClass} mb-4`}>{error}</p>
        <button className={ghostBtn} onClick={() => navigate(-1)}>
          ← Back
        </button>
      </div>
    );
  }

  if (!analysis) return null;

  const missingSkills = analysis.missingSkills || [];
  const missingBonusSkills = analysis.missingBonusSkills || [];
  
  const hasMissingSkills = missingSkills.length > 0 || missingBonusSkills.length > 0;

  return (
    <div className={pageWrapper}>
      {/* PAGE HEADER */}
      <div className="mb-8 flex flex-col gap-2">
        <p className={tagClass}>Skill Enhancement Interface</p>
        <h1 className={headingClass}>Add Missing Skills</h1>
        <p className="text-sm text-[#9e9aa7] font-medium">
          {analysis.resumeId?.originalFileName} • Targeted for: {analysis.resumeId?.targetRole}
        </p>
      </div>

      <div className={divider}></div>

      {/* INSTRUCTIONS */}
      <div className="my-8 bg-gradient-to-r from-[#f4f1ff] to-[#f9f6f2] border border-[#d4cff7] rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-[#1a1a2e] mb-2">
          Boost Your ATS Score
        </h2>
        <p className="text-[#5c5470] text-sm leading-relaxed">
          Select the skills below that you possess but are missing from your resume. 
          When you save, we will append these to your profile and re-analyze your resume 
          to improve your score instantly. <strong>Only select skills you genuinely have!</strong>
        </p>
      </div>

      {/* SKILL SELECTION */}
      {!hasMissingSkills ? (
        <div className="my-10 text-center bg-[#f0fdf4] border border-[#b6f0d0] rounded-2xl p-8">
          <p className="text-[#2ecc8a] font-bold text-xl mb-2">Great Job!</p>
          <p className="text-[#1a7d4c]">Your resume already includes all recommended core and bonus skills for this role.</p>
        </div>
      ) : (
        <div className="my-10 flex flex-col gap-8">
          
          {/* CORE SKILLS */}
          {missingSkills.length > 0 && (
            <div>
              <p className={`${analysisSectionTitle} mb-4 flex items-center gap-2`}>
                <span className="w-2 h-6 bg-[#e05252] rounded-full inline-block"></span>
                Critical Missing Core Skills
              </p>
              <div className="flex flex-wrap gap-3">
                {missingSkills.map((skill, i) => {
                  const isSelected = selectedSkills.includes(skill);
                  return (
                    <button
                      key={`core-${i}`}
                      onClick={() => toggleSkill(skill)}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all duration-200 border-2 ${
                        isSelected 
                          ? "bg-[#fff1f1] border-[#e05252] text-[#c0392b] shadow-md transform -translate-y-0.5" 
                          : "bg-white border-[#e8e3dc] text-[#9e9aa7] hover:border-[#e05252]/40 hover:text-[#e05252]"
                      }`}
                    >
                      {isSelected ? "✓ " : "+ "}{skill}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* BONUS SKILLS */}
          {missingBonusSkills.length > 0 && (
            <div>
              <p className={`${analysisSectionTitle} mb-4 flex items-center gap-2`}>
                <span className="w-2 h-6 bg-[#6c63ff] rounded-full inline-block"></span>
                Recommended Bonus Skills
              </p>
              <div className="flex flex-wrap gap-3">
                {missingBonusSkills.map((skill, i) => {
                  const isSelected = selectedSkills.includes(skill);
                  return (
                    <button
                      key={`bonus-${i}`}
                      onClick={() => toggleSkill(skill)}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all duration-200 border-2 ${
                        isSelected 
                          ? "bg-[#f4f1ff] border-[#6c63ff] text-[#5548e0] shadow-md transform -translate-y-0.5" 
                          : "bg-white border-[#e8e3dc] text-[#9e9aa7] hover:border-[#6c63ff]/40 hover:text-[#6c63ff]"
                      }`}
                    >
                      {isSelected ? "✓ " : "+ "}{skill}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <div className={divider}></div>

      {/* ACTIONS */}
      <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <button className={ghostBtn} onClick={() => navigate(-1)} disabled={saving}>
          ← Cancel and Go Back
        </button>
        
        {hasMissingSkills && (
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-[#9e9aa7]">
              {selectedSkills.length} skill{selectedSkills.length !== 1 && 's'} selected
            </span>
            <button
              onClick={handleSaveAndAnalyze}
              disabled={saving || selectedSkills.length === 0}
              className="bg-[#6c63ff] text-white font-bold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl hover:bg-[#5548e0] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
            >
              {saving ? "Saving & Analyzing..." : "Save & Re-Analyze"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default EditSkills;
