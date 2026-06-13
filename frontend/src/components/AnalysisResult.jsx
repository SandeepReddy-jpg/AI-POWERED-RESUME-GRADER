import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { toast } from "react-hot-toast";
import axios from "axios";
import EnhancedAnalysis from "./EnhancedAnalysis";
import { parseResume, rebuild } from "./ResumeDocumentEditor";
import {
  pageWrapper,
  headingClass,
  loadingClass,
  errorClass,
  divider,
  tagClass,
  analysisSectionTitle,
  missingPill,
  weaknessBullet,
  scoreLargeClass,
  scoreSubClass,
  ghostBtn,
} from "../styles/common";
import BASE_URL from "../config/api";


function AnalysisResult() {
  const { resumeId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [selectedRole, setSelectedRole] = useState("");

  //fetch analysis for this resume
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
          setSelectedRole(res.data.payload.resumeId?.targetRole || "");
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load analysis");
      } finally {
        setLoading(false);
      }
    };
    getAnalysis();
  }, [resumeId]);

  //score color based on value
  const getScoreColor = (score) => {
    if (score >= 75) return "text-[#2ecc8a]";
    if (score >= 50) return "text-[#f0894d]";
    return "text-[#e05252]";
  };

  //score label
  const getScoreLabel = (score) => {
    if (score >= 75) return "Strong";
    if (score >= 50) return "Average";
    return "Needs Work";
  };

  const onReanalyze = async () => {
    setAnalyzing(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(`${BASE_URL}/analysis/analyze/${resumeId}`, { targetRole: selectedRole }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 200) {
        setAnalysis(res.data.payload);
        toast.success("Re-analysis complete!");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Re-analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  const quickAddSkill = async (skill) => {
    setAnalyzing(true);
    try {
      const token = localStorage.getItem("token");
      const currentText = analysis.resumeId?.parsedText || "";
      const sections = parseResume(currentText);
      if (!sections.skills.includes(skill)) {
        sections.skills.push(skill);
      }
      const newText = rebuild(sections);

      // Save
      await axios.post(`${BASE_URL}/resume/${resumeId}/update-content`, 
        { content: newText },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Re-analyze
      const res = await axios.post(`${BASE_URL}/analysis/analyze/${resumeId}`, 
        { targetRole: selectedRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.status === 200) {
        setAnalysis(res.data.payload);
        toast.success(`✨ Added "${skill}" and re-analyzed!`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add skill");
    } finally {
      setAnalyzing(false);
    }
  };

  const applyRewrite = async (original, rewritten) => {
    setAnalyzing(true);
    try {
      const token = localStorage.getItem("token");
      let currentText = analysis.resumeId?.parsedText || "";
      
      const cleanOriginal = original.replace(/^[-•·*0-9.]\s*/, "").trim();
      const cleanRewritten = rewritten.replace(/^[-•·*0-9.]\s*/, "").trim();

      // Look for the line containing cleanOriginal
      const lines = currentText.split("\n");
      const lineIndex = lines.findIndex(line => line.includes(cleanOriginal));
      let newText = currentText;
      
      if (lineIndex !== -1) {
        const prefix = lines[lineIndex].match(/^[-•·*0-9.]\s*/) ? lines[lineIndex].match(/^[-•·*0-9.]\s*/)[0] : "• ";
        lines[lineIndex] = prefix + cleanRewritten;
        newText = lines.join("\n");
      } else {
        // Fallback simple replace
        newText = currentText.replace(original, rewritten);
      }
      
      if (newText === currentText) {
        // Try to replace case insensitive or substring
        const foundLine = lines.find(line => line.toLowerCase().includes(cleanOriginal.toLowerCase().substring(0, 15)));
        if (foundLine) {
          const prefix = foundLine.match(/^[-•·*0-9.]\s*/) ? foundLine.match(/^[-•·*0-9.]\s*/)[0] : "• ";
          const foundIdx = lines.indexOf(foundLine);
          lines[foundIdx] = prefix + cleanRewritten;
          newText = lines.join("\n");
        }
      }

      if (newText === currentText) {
        toast.error("Could not find the original text in the resume. Try editing it manually.");
        setAnalyzing(false);
        return;
      }

      // Save
      await axios.post(`${BASE_URL}/resume/${resumeId}/update-content`, 
        { content: newText },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Re-analyze
      const res = await axios.post(`${BASE_URL}/analysis/analyze/${resumeId}`, 
        { targetRole: selectedRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.status === 200) {
        setAnalysis(res.data.payload);
        toast.success("✨ Bullet point updated and resume re-analyzed!");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to apply rewrite");
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return <p className={loadingClass}>Loading analysis...</p>;
  }

  if (error) {
    return (
      <div className={pageWrapper}>
        <p className={`${errorClass} mb-4`}>{error}</p>
        <button className={ghostBtn} onClick={() => navigate(-1)}>
          ← Back to Resume
        </button>
      </div>
    );
  }

  if (!analysis) return null;

  return (
    <div className={pageWrapper}>
      {/* PAGE HEADER */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <p className={tagClass}>AI Analysis Report</p>
          <h1 className={headingClass}>Resume Analysis</h1>
          <p className="text-sm text-[#9e9aa7] font-medium">
            {analysis.resumeId?.originalFileName}
          </p>
        </div>

        {/* RE-ANALYZE SECTION */}
        <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-2xl border border-[#e8e3dc] shadow-sm">
          <select 
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="text-sm font-semibold text-[#1a1a2e] bg-[#f9f6f2] border-none rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#6c63ff]/20 cursor-pointer"
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
          <button 
            onClick={onReanalyze} 
            disabled={analyzing}
            className="bg-[#6c63ff] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#5548e0] hover:shadow-md transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {analyzing ? "Analyzing..." : "Re-Analyze"}
          </button>
        </div>
      </div>

      <div className={divider}></div>

      {/* ATS SCORE */}
      <div className="my-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* MAIN SCORE CARD */}
        <div className="bg-gradient-to-br from-white to-[#f4f1ff] border border-[#d4cff7] rounded-2xl p-8 shadow-sm flex flex-col items-center justify-center text-center gap-3">
          <span className={`${scoreLargeClass} ${getScoreColor(analysis.atsScore)}`}>
            {analysis.atsScore}
          </span>
          <span className={scoreSubClass}>Current ATS Score</span>
          <span className={`text-xs font-bold uppercase tracking-[0.2em] px-3 py-1.5 rounded-full bg-white border border-[#e8e3dc] shadow-sm ${getScoreColor(analysis.atsScore)}`}>
            {getScoreLabel(analysis.atsScore)}
          </span>
        </div>

        {/* PREDICTED SCORE CARD */}
        <div className="bg-gradient-to-br from-white to-[#f0fdf4] border border-[#b6f0d0] rounded-2xl p-8 shadow-sm flex flex-col items-center justify-center text-center gap-3">
          <span className="text-7xl font-bold text-[#2ecc8a] tracking-tight">
            {analysis.improvedScorePrediction}
          </span>
          <span className={scoreSubClass}>Predicted After Improvements</span>
        </div>

        {/* BREAKDOWN */}
        <div className="bg-white border border-[#e8e3dc] rounded-2xl p-8 shadow-sm flex flex-col justify-center">
          <p className={analysisSectionTitle}>Score Breakdown</p>
          <div className="flex flex-col gap-4 mt-2">
            {Object.entries(analysis.scoreBreakdown || {}).map(
              ([key, value]) => (
                <div key={key} className="flex items-center gap-4">
                  <span className="text-sm font-medium text-[#5c5470] w-28 capitalize">
                    {key}
                  </span>
                  <div className="flex-1 bg-[#f4f1ee] rounded-full h-2">
                    <div
                      className="bg-[#6c63ff] h-2 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${Math.min(100, (value / (key === 'skills' ? 35 : key === 'projects' ? 25 : key === 'formatting' ? 15 : key === 'achievements' ? 15 : 10)) * 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-[#1a1a2e] w-8 text-right">
                    {value}
                  </span>
                </div>
              ),
            )}
          </div>
        </div>
      </div>

      <div className={divider}></div>

      {/* SKILLS & WEAKNESSES */}
      <div className="my-10 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="flex flex-col gap-6">
          <div>
            <p className={analysisSectionTitle}>Critical Missing Skills</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {analysis.missingSkills?.length > 0 ? (
                analysis.missingSkills.map((skill, i) => (
                  <div key={i} className="flex items-center gap-1.5 bg-[#fff1f1] border border-[#fcd5d5] rounded-full pl-3 pr-1 py-1 text-xs select-none">
                    <span className="font-semibold text-[#c0392b] capitalize">{skill}</span>
                    <button 
                      onClick={() => quickAddSkill(skill)}
                      disabled={analyzing}
                      className="bg-[#e05252] text-white font-bold w-5 h-5 rounded-full flex items-center justify-center hover:bg-[#c93d3d] transition-colors cursor-pointer text-[10px] disabled:opacity-50"
                      title="Quick Add to Resume"
                    >
                      +
                    </button>
                  </div>
                ))
              ) : (
                <span className="text-sm text-[#2ecc8a] font-medium">
                  All core skills present!
                </span>
              )}
            </div>
          </div>
          
          {analysis.missingBonusSkills && analysis.missingBonusSkills.length > 0 && (
            <div>
              <p className={analysisSectionTitle}>Recommended Additions (Bonus)</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {analysis.missingBonusSkills.map((skill, i) => (
                  <div key={i} className="flex items-center gap-1.5 bg-[#f4f1ff] border border-[#d4cff7] rounded-full pl-3 pr-1 py-1 text-xs select-none">
                    <span className="font-semibold text-[#5548e0] capitalize">{skill}</span>
                    <button 
                      onClick={() => quickAddSkill(skill)}
                      disabled={analyzing}
                      className="bg-[#6c63ff] text-white font-bold w-5 h-5 rounded-full flex items-center justify-center hover:bg-[#5548e0] transition-colors cursor-pointer text-[10px] disabled:opacity-50"
                      title="Quick Add to Resume"
                    >
                      +
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-2">
            <button
              onClick={() => navigate(`/analysis/${resumeId}/edit-skills`)}
              className="bg-[#f4f1ff] border border-[#d4cff7] text-[#6c63ff] text-sm font-bold px-6 py-3 rounded-xl hover:shadow-md hover:border-[#6c63ff]/40 transition-all duration-200"
            >
              Add Missing Skills
            </button>
          </div>
        </div>

        <div>
          <p className={analysisSectionTitle}>Key Weaknesses</p>
          <div className="flex flex-col gap-3 mt-2">
            {analysis.weaknesses?.length > 0 ? (
              analysis.weaknesses.map((weakness, i) => (
                <div key={i} className={weaknessBullet}>
                  <span className="text-[#e05252] font-bold shrink-0 mt-0.5">✕</span>
                  <span>{weakness}</span>
                </div>
              ))
            ) : (
              <span className="text-sm text-[#2ecc8a] font-medium">
                No major weaknesses found!
              </span>
            )}
          </div>
        </div>
      </div>

      <div className={divider}></div>

      {/* ENHANCED ANALYSIS - EDIT, DOWNLOAD, QUICK MATCH */}
      <EnhancedAnalysis analysis={analysis} resumeId={resumeId} />

      <div className={divider}></div>

      {/* RECOMMENDATIONS */}
      <div className="my-10">
        <p className={analysisSectionTitle}>AI Recommendations to Boost Score</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {analysis.recommendations.map((rec, i) => (
            <div key={i} className="bg-white border border-[#e8e3dc] p-6 rounded-2xl flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
              <span className="w-8 h-8 rounded-full bg-[#f4f1ff] text-[#6c63ff] flex items-center justify-center font-bold shrink-0 text-sm">
                {i + 1}
              </span>
              <span className="text-sm text-[#1a1a2e] leading-relaxed pt-1">{rec}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={divider}></div>

      {/* AI BULLET POINT REWRITER */}
      {analysis.bulletPointRewrites && analysis.bulletPointRewrites.length > 0 && (
        <>
          <div className="my-10">
            <p className={analysisSectionTitle}>AI Bullet Point Enhancements</p>
            <p className="text-sm text-[#5c5470] mb-6">We identified weak bullet points in your resume and rewrote them to be ATS-friendly and impactful.</p>
            
            <div className="flex flex-col gap-6">
              {analysis.bulletPointRewrites.map((rewrite, i) => (
                <div key={i} className="bg-white border border-[#e8e3dc] rounded-3xl overflow-hidden shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2">
                    {/* Original */}
                    <div className="p-6 bg-[#f4f1ee]/50 border-b md:border-b-0 md:border-r border-[#e8e3dc]">
                      <p className="text-xs font-bold text-[#e05252] uppercase tracking-widest mb-3 flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-[#fff1f1] flex items-center justify-center">✕</span> 
                        Original (Weak)
                      </p>
                      <p className="text-sm text-[#5c5470] italic">"{rewrite.original}"</p>
                    </div>
                    {/* Rewritten */}
                    <div className="p-6 bg-[#f0fdf4]/30 relative overflow-hidden flex flex-col justify-between min-h-[140px]">
                      {/* Decorative accent */}
                      <div className="absolute top-0 right-0 w-16 h-16 bg-[#2ecc8a]/5 rounded-bl-full" />
                      
                      <div className="relative z-10">
                        <p className="text-xs font-bold text-[#2ecc8a] uppercase tracking-widest mb-3 flex items-center gap-2">
                          <span className="w-4 h-4 rounded-full bg-[#e6fcf0] flex items-center justify-center">✓</span> 
                          Rewritten (Strong)
                        </p>
                        <p className="text-sm font-medium text-[#1a1a2e] mb-4">"{rewrite.rewritten}"</p>
                      </div>
                      
                      <button
                        onClick={() => applyRewrite(rewrite.original, rewrite.rewritten)}
                        disabled={analyzing}
                        className="relative z-10 self-start bg-[#2ecc8a] text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-[#27ae76] hover:shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                      >
                        ⚡ Apply Suggestion & Re-Analyze
                      </button>
                    </div>
                  </div>
                  {/* Explanation */}
                  <div className="px-6 py-4 bg-[#f9f6f2] border-t border-[#e8e3dc] flex items-start gap-3">
                    <span className="text-lg">💡</span>
                    <p className="text-xs text-[#5c5470] leading-relaxed pt-0.5"><span className="font-semibold text-[#1a1a2e]">Why this is better:</span> {rewrite.explanation}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className={divider}></div>
        </>
      )}

      {/* RECRUITER FEEDBACK */}
      <div className="my-10">
        <p className={analysisSectionTitle}>Recruiter Feedback</p>
        <div className="bg-gradient-to-r from-[#f9f6f2] to-white border border-[#e8e3dc] rounded-2xl p-8 shadow-sm">
          <p className="text-[#5c5470] text-base leading-relaxed italic">
            "{analysis.recruiterFeedback}"
          </p>
        </div>
      </div>

      {/* BACK */}
      <div className="mt-8">
        <button className={ghostBtn} onClick={() => navigate(-1)}>
          ← Back to Resume
        </button>
      </div>
    </div>
  );
}

export default AnalysisResult;
