import { useState } from "react";
import { toast } from "react-hot-toast";
import ResumeDocumentEditor from "./ResumeDocumentEditor";


function EnhancedAnalysis({ analysis, resumeId, onAnalysisUpdate }) {
  const [downloading, setDownloading] = useState(false);
  const [editedResume, setEditedResume] = useState(analysis.resumeId?.parsedText || "");
  console.log("EnhancedAnalysis got parsedText:", analysis.resumeId?.parsedText);

  // Download analysis as JSON
  const handleDownloadJSON = async () => {
    try {
      setDownloading(true);
      const dataStr = JSON.stringify(analysis, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `resume-analysis-${new Date().toISOString().split("T")[0]}.json`;
      link.click();
      toast.success("Analysis downloaded as JSON!");
    } catch (err) {
      toast.error("Failed to download analysis");
    } finally {
      setDownloading(false);
    }
  };

  // Download analysis as PDF
  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
            h1 { color: #6c63ff; border-bottom: 3px solid #6c63ff; padding-bottom: 10px; }
            h2 { color: #1a1a2e; margin-top: 20px; }
            .score-box { background: #f4f1ff; padding: 15px; border-radius: 8px; margin: 10px 0; }
            .skill { display: inline-block; background: #e8e3dc; padding: 5px 10px; border-radius: 5px; margin: 5px; }
            .weakness { color: #e05252; margin: 10px 0; }
            .recommendation { background: #f0fdf4; padding: 10px; margin: 10px 0; border-left: 4px solid #2ecc8a; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #e8e3dc; padding: 10px; text-align: left; }
            th { background: #f4f1ff; }
          </style>
        </head>
        <body>
          <h1>📋 Resume Analysis Report</h1>
          <p><strong>File:</strong> ${analysis.resumeId?.originalFileName}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          
          <h2>📊 ATS Scores</h2>
          <div class="score-box">
            <strong>Current ATS Score:</strong> ${analysis.atsScore}/100
          </div>
          <div class="score-box">
            <strong>Predicted After Improvements:</strong> ${analysis.improvedScorePrediction}/100
          </div>
          
          <h2>Score Breakdown</h2>
          <table>
            <tr><th>Category</th><th>Score</th></tr>
            ${Object.entries(analysis.scoreBreakdown || {}).map(([key, value]) => `<tr><td>${key}</td><td>${value}</td></tr>`).join("")}
          </table>
          
          <h2>❌ Missing Skills</h2>
          <div>${analysis.missingSkills?.map(skill => `<span class="skill">${skill}</span>`).join("")}</div>
          
          <h2>⚠️ Key Weaknesses</h2>
          ${analysis.weaknesses?.map(w => `<div class="weakness">• ${w}</div>`).join("")}
          
          <h2>💡 Recommendations</h2>
          ${analysis.recommendations?.map(rec => `<div class="recommendation">${rec}</div>`).join("")}
        </body>
        </html>
      `;
      
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `resume-analysis-${new Date().toISOString().split("T")[0]}.html`;
      link.click();
      toast.success("Analysis downloaded as PDF-ready HTML!");
    } catch (err) {
      toast.error("Failed to download as PDF");
    } finally {
      setDownloading(false);
    }
  };


  return (
    <div className="space-y-8">
      {/* DOWNLOAD SECTION */}
      <div className="bg-gradient-to-br from-[#f4f1ff] to-white border border-[#d4cff7] rounded-3xl p-8 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-[#1a1a2e]">📥 Export Analysis</h3>
            <p className="text-sm text-[#5c5470] mt-1">Download your analysis in different formats</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleDownloadJSON}
              disabled={downloading}
              className="bg-[#6c63ff] text-white font-semibold px-6 py-3 rounded-xl hover:shadow-lg transition-all disabled:opacity-60"
            >
              {downloading ? "⏳" : "📄"} JSON
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="bg-[#2ecc8a] text-white font-semibold px-6 py-3 rounded-xl hover:shadow-lg transition-all disabled:opacity-60"
            >
              {downloading ? "⏳" : "📊"} HTML/PDF
            </button>
          </div>
        </div>
      </div>

      {/* MANUAL RESUME EDITOR SECTION */}
      <div className="bg-gradient-to-br from-[#f4f1ff] to-white border border-[#d4cff7] rounded-3xl p-8 shadow-sm">
        <ResumeDocumentEditor
          resumeText={editedResume}
          resumeId={resumeId}
          resumeUrl={analysis.resumeId?.resumeUrl}
          onSave={(newContent) => {
            setEditedResume(newContent);
          }}
        />
      </div>

      {/* DETAILED SCORE ANALYSIS */}
      <div className="bg-white border border-[#e8e3dc] rounded-3xl p-8 shadow-sm">
        <h3 className="text-lg font-bold text-[#1a1a2e] mb-6">📈 Detailed Score Analysis</h3>

        {/* Score Breakdown Table */}
        <div className="overflow-x-auto mb-8">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-[#d4cff7]">
                <th className="text-left font-bold text-[#1a1a2e] py-4 px-4">Category</th>
                <th className="text-left font-bold text-[#1a1a2e] py-4 px-4">Current</th>
                <th className="text-left font-bold text-[#1a1a2e] py-4 px-4">Progress</th>
                <th className="text-left font-bold text-[#1a1a2e] py-4 px-4">Impact</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(analysis.scoreBreakdown || {}).map(([key, value]) => {
                const maxScore = key === "skills" ? 35 : key === "projects" ? 25 : key === "formatting" ? 15 : key === "achievements" ? 15 : 10;
                const percentage = Math.round((value / maxScore) * 100);
                return (
                  <tr key={key} className="border-b border-[#e8e3dc] hover:bg-[#f9f6f2] transition-colors">
                    <td className="py-4 px-4 capitalize font-semibold text-[#1a1a2e]">{key}</td>
                    <td className="py-4 px-4 font-bold text-[#6c63ff]">{value}/{maxScore}</td>
                    <td className="py-4 px-4">
                      <div className="w-full bg-[#f4f1ee] rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-[#6c63ff] to-[#2ecc8a] h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                        percentage >= 80 ? "bg-[#e6fcf0] text-[#2ecc8a]" : 
                        percentage >= 60 ? "bg-[#fef3c7] text-[#f0894d]" : 
                        "bg-[#fef2f2] text-[#e05252]"
                      }`}>
                        {percentage >= 80 ? "Strong" : percentage >= 60 ? "Good" : "Improve"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Improvement Opportunities */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#fef2f2] border border-[#fcd5d5] rounded-xl p-4">
            <p className="text-xs font-bold text-[#e05252] uppercase mb-2">🎯 Top Priority</p>
            <p className="text-sm text-[#1a1a2e]">
              Improve <strong>Skills</strong> section - highest impact on ATS score (+{Math.min(20, 35 - (analysis.scoreBreakdown?.skills || 0))} points possible)
            </p>
          </div>
          <div className="bg-[#f0fdf4] border border-[#b6f0d0] rounded-xl p-4">
            <p className="text-xs font-bold text-[#2ecc8a] uppercase mb-2">💪 You're Strong In</p>
            <p className="text-sm text-[#1a1a2e]">
              <strong>Formatting</strong> is excellent - keep this consistency across your resume
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EnhancedAnalysis;
