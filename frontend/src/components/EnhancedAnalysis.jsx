import { useState } from "react";
import { toast } from "react-hot-toast";
import axios from "axios";

const BASE_URL = "http://localhost:4000/api";

// Predefined companies and roles
const PREDEFINED_COMPANIES = [
  { name: "Google", roles: ["Software Engineer", "Product Manager", "Data Scientist", "UX Designer"] },
  { name: "Microsoft", roles: ["Software Engineer", "Cloud Engineer", "Data Scientist", "Product Manager"] },
  { name: "Amazon", roles: ["SDE", "Data Scientist", "Product Manager", "Operations Engineer"] },
  { name: "Meta", roles: ["Software Engineer", "Analytics Engineer", "Product Manager", "UX Engineer"] },
  { name: "Apple", roles: ["Software Engineer", "Hardware Engineer", "Data Scientist", "Design"] },
  { name: "Tesla", roles: ["Software Engineer", "Electrical Engineer", "Data Scientist", "Manufacturing Engineer"] },
  { name: "Netflix", roles: ["Software Engineer", "Data Engineer", "Machine Learning Engineer", "Product Manager"] },
  { name: "Airbnb", roles: ["Software Engineer", "Data Scientist", "Product Manager", "UX Designer"] },
  { name: "Uber", roles: ["Software Engineer", "Data Scientist", "Product Manager", "Operations Engineer"] },
  { name: "Stripe", roles: ["Software Engineer", "Full Stack Developer", "Payment Systems Engineer", "Data Scientist"] },
  { name: "Coinbase", roles: ["Blockchain Engineer", "Full Stack Developer", "Product Manager", "Data Analyst"] },
  { name: "Figma", roles: ["Frontend Engineer", "Full Stack Developer", "Product Manager", "Design"] },
];

function EnhancedAnalysis({ analysis, resumeId }) {
  const [editingSkill, setEditingSkill] = useState(null);
  const [newSkill, setNewSkill] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [downloading, setDownloading] = useState(false);

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

  // Add new skill suggestion via AI
  const handleAddSkillWithAI = async () => {
    if (!newSkill.trim()) {
      toast.error("Please enter a skill");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${BASE_URL}/analysis/${resumeId}/add-skill`,
        { skill: newSkill },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Skill "${newSkill}" added successfully!`);
      setNewSkill("");
      // Refresh analysis
      window.location.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add skill");
    }
  };

  // Quick job match with predefined role
  const handleQuickJobMatch = () => {
    if (!selectedCompany || !selectedRole) {
      toast.error("Please select both company and role");
      return;
    }
    // Navigate to job matcher with predefined job description
    const jobDescription = `
Role: ${selectedRole} at ${selectedCompany}

We are looking for a talented ${selectedRole} to join our team at ${selectedCompany}. 
You will work on impactful projects and collaborate with world-class engineers.

Requirements:
- 3+ years of experience in relevant field
- Strong problem-solving skills
- Experience with industry-standard tools and frameworks
- Bachelor's degree in Computer Science or related field

Preferred:
- Experience with cloud platforms
- Understanding of system design
- Passion for continuous learning
- Team collaboration experience
    `;
    
    // This would be passed to the job matcher
    window.sessionStorage.setItem("quickJobDescription", jobDescription);
    window.location.href = `/job-match/${resumeId}`;
  };

  const getRolesByCompany = () => {
    const company = PREDEFINED_COMPANIES.find(c => c.name === selectedCompany);
    return company ? company.roles : [];
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

      {/* EDIT & ENHANCE SKILLS SECTION */}
      <div className="bg-white border border-[#e8e3dc] rounded-3xl p-8 shadow-sm">
        <h3 className="text-lg font-bold text-[#1a1a2e] mb-6">✏️ Enhance Your Skills</h3>
        
        <div className="flex gap-3 mb-6">
          <input
            type="text"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            placeholder="e.g., React, Python, Kubernetes..."
            className="flex-1 bg-[#f9f6f2] border border-[#e8e3dc] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#6c63ff]/20"
            onKeyPress={(e) => e.key === "Enter" && handleAddSkillWithAI()}
          />
          <button
            onClick={handleAddSkillWithAI}
            className="bg-[#6c63ff] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#5548e0] transition-all"
          >
            Add with AI
          </button>
        </div>

        <div className="bg-[#f9f6f2] rounded-2xl p-6">
          <p className="text-xs font-bold text-[#5c5470] uppercase mb-4">Current Skills in Resume</p>
          <div className="flex flex-wrap gap-3">
            {analysis.skills?.map((skill, idx) => (
              <div
                key={idx}
                className="bg-white border border-[#d4cff7] text-[#6c63ff] px-4 py-2 rounded-xl text-sm font-semibold hover:shadow-md transition-all"
              >
                {skill}
                <span className="ml-2 cursor-pointer text-[#e05252]">×</span>
              </div>
            )) || <span className="text-sm text-[#5c5470]">No skills extracted yet</span>}
          </div>
        </div>
      </div>

      {/* QUICK JOB MATCH SECTION */}
      <div className="bg-gradient-to-br from-[#f0fdf4] to-white border border-[#b6f0d0] rounded-3xl p-8 shadow-sm">
        <h3 className="text-lg font-bold text-[#1a1a2e] mb-6">🎯 Quick Job Match</h3>
        <p className="text-sm text-[#5c5470] mb-6">Match your resume against roles at top companies</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Company Select */}
          <div>
            <label className="text-xs font-bold text-[#1a1a2e] uppercase mb-2 block">Company</label>
            <select
              value={selectedCompany}
              onChange={(e) => {
                setSelectedCompany(e.target.value);
                setSelectedRole(""); // Reset role when company changes
              }}
              className="w-full bg-white border border-[#e8e3dc] rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#2ecc8a]/20"
            >
              <option value="">Select Company...</option>
              {PREDEFINED_COMPANIES.map((company) => (
                <option key={company.name} value={company.name}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>

          {/* Role Select */}
          <div>
            <label className="text-xs font-bold text-[#1a1a2e] uppercase mb-2 block">Role</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              disabled={!selectedCompany}
              className="w-full bg-white border border-[#e8e3dc] rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#2ecc8a]/20 disabled:opacity-50"
            >
              <option value="">Select Role...</option>
              {getRolesByCompany().map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Match Button */}
          <div className="flex items-end">
            <button
              onClick={handleQuickJobMatch}
              disabled={!selectedCompany || !selectedRole}
              className="w-full bg-[#2ecc8a] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#24a85f] hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🚀 Match Job
            </button>
          </div>
        </div>

        {/* Popular Companies Preview */}
        <div className="bg-white rounded-2xl p-6">
          <p className="text-xs font-bold text-[#5c5470] uppercase mb-4">📌 Popular Companies</p>
          <div className="flex flex-wrap gap-2">
            {PREDEFINED_COMPANIES.slice(0, 6).map((company) => (
              <button
                key={company.name}
                onClick={() => setSelectedCompany(company.name)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  selectedCompany === company.name
                    ? "bg-[#2ecc8a] text-white"
                    : "bg-[#f9f6f2] text-[#1a1a2e] hover:bg-[#f4f1ee]"
                }`}
              >
                {company.name}
              </button>
            ))}
          </div>
        </div>
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
