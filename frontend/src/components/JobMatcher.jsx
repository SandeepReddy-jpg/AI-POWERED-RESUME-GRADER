import { useState, useEffect } from "react";
import { useParams } from "react-router";
import axios from "axios";
import toast from "react-hot-toast";
import BASE_URL from "../config/api";


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

// Job descriptions for predefined roles
const PREDEFINED_JOB_DESCRIPTIONS = {
  "Google-Software Engineer": `
Role: Software Engineer at Google

About the Role:
Google is seeking talented software engineers to join our world-class team. You will work on products that impact billions of users worldwide.

Responsibilities:
- Design, develop, and maintain scalable software systems
- Collaborate with cross-functional teams to deliver high-quality products
- Participate in code reviews and share knowledge with teammates
- Optimize performance and reliability of services

Requirements:
- 3+ years of software development experience
- Strong proficiency in one or more programming languages (Java, C++, Python, Go, JavaScript)
- Solid understanding of data structures and algorithms
- Experience with distributed systems or microservices
- Bachelor's degree in Computer Science or equivalent

Nice to have:
- Experience with cloud platforms (GCP, AWS, Azure)
- Familiarity with machine learning concepts
- Open source contributions
- Experience mentoring junior engineers
  `,
  "Microsoft-Software Engineer": `
Role: Software Engineer at Microsoft

About the Role:
Join Microsoft and help shape the future of cloud computing. We're looking for talented engineers to build next-generation technologies.

Responsibilities:
- Develop and maintain cloud-based solutions
- Write clean, maintainable, and well-tested code
- Collaborate with product teams to understand requirements
- Contribute to architectural decisions and system design

Requirements:
- 2+ years of professional software development experience
- Proficiency in C#, C++, Java, or JavaScript
- Experience with .NET or cloud platforms
- Strong problem-solving skills
- Bachelor's degree in Computer Science or related field

Preferred:
- Experience with Azure cloud services
- Understanding of DevOps practices
- Knowledge of containerization (Docker, Kubernetes)
- Experience with REST APIs
  `,
  "Amazon-SDE": `
Role: Software Development Engineer (SDE) at Amazon

About the Role:
Amazon is looking for Software Development Engineers to build customer-centric applications. You'll work on systems that serve millions of customers globally.

Responsibilities:
- Design and implement software solutions
- Write production-quality code
- Participate in system design and architecture discussions
- Mentor junior engineers and contribute to team growth
- Own end-to-end delivery from design to deployment

Requirements:
- 2+ years of professional development experience
- Strong programming skills in Java, C++, Python, or JavaScript
- Understanding of object-oriented design and data structures
- Experience with relational and non-relational databases
- Bachelor's degree in Computer Science or equivalent

Desired:
- Experience with AWS services
- Knowledge of distributed systems
- Familiarity with agile development
- Experience with large-scale systems
  `,
};

const JobMatcher = () => {
  const { resumeId } = useParams();
  const [resumeTitle, setResumeTitle] = useState("Loading...");
  const [jobDescription, setJobDescription] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [savedMatches, setSavedMatches] = useState([]);
  const [showSaved, setShowSaved] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedRole, setSelectedRole] = useState("");

  const token = localStorage.getItem("token");

  // Get predefined job description
  const handleSelectPredefinedJob = () => {
    if (!selectedCompany || !selectedRole) {
      toast.error("Please select both company and role");
      return;
    }

    const key = `${selectedCompany}-${selectedRole}`;
    const predefinedDesc = PREDEFINED_JOB_DESCRIPTIONS[key] || 
      `Role: ${selectedRole} at ${selectedCompany}\n\nThis is a position for ${selectedRole} at ${selectedCompany}. Please provide specific requirements and responsibilities.`;
    
    setJobDescription(predefinedDesc);
    setJobTitle(selectedRole);
    setCompany(selectedCompany);
    toast.success(`Loaded ${selectedRole} position at ${selectedCompany}`);
  };

  const getRolesByCompany = () => {
    const companyData = PREDEFINED_COMPANIES.find(c => c.name === selectedCompany);
    return companyData ? companyData.roles : [];
  };

  // Fetch resume details
  useEffect(() => {
    const fetchResume = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/resume/${resumeId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data.success) {
          setResumeTitle(response.data.data.title);
        }
      } catch (error) {
        toast.error("Failed to load resume");
      }
    };

    if (resumeId && token) {
      fetchResume();
    }
  }, [resumeId, token]);

  // Analyze job match
  const handleAnalyzeJob = async (e) => {
    e.preventDefault();

    if (!jobDescription.trim() || !jobTitle.trim()) {
      toast.error("Please provide job title and description");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${BASE_URL}/job-match/analyze-job`,
        {
          resumeId,
          jobTitle,
          jobDescription,
          company,
          jobUrl,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        setResult(response.data.data);
        toast.success("Job analysis completed!");
        setJobDescription("");
        setJobTitle("");
        setCompany("");
        setJobUrl("");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.response?.data?.message || "Failed to analyze job");
    } finally {
      setLoading(false);
    }
  };

  // Fetch saved matches
  const fetchSavedMatches = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/job-match/matches`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setSavedMatches(response.data.data);
        setShowSaved(true);
      }
    } catch (error) {
      toast.error("Failed to fetch saved matches");
    }
  };

  // Delete a match
  const deleteMatch = async (matchId) => {
    try {
      const response = await axios.delete(`${BASE_URL}/job-match/matches/${matchId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setSavedMatches(savedMatches.filter((m) => m._id !== matchId));
        toast.success("Match deleted successfully");
      }
    } catch (error) {
      toast.error("Failed to delete match");
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">🎯 Job Match Analyzer</h2>
        <p className="text-gray-600">Paste a job description to see how well your resume matches & get personalized improvement suggestions</p>
        <p className="text-sm text-gray-500 mt-2">Resume: <span className="font-semibold">{resumeTitle}</span></p>
      </div>

      {/* Input Form */}
      <form onSubmit={handleAnalyzeJob} className="bg-white rounded-lg shadow-md p-6 mb-8">
        {/* PREDEFINED COMPANIES SECTION */}
        <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-emerald-200 rounded-lg">
          <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            ⚡ Quick Match: Select a Predefined Role
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">Company</label>
              <select
                value={selectedCompany}
                onChange={(e) => {
                  setSelectedCompany(e.target.value);
                  setSelectedRole("");
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
              >
                <option value="">Select Company...</option>
                {PREDEFINED_COMPANIES.map((c) => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">Role</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                disabled={!selectedCompany}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm disabled:opacity-50"
              >
                <option value="">Select Role...</option>
                {getRolesByCompany().map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={handleSelectPredefinedJob}
                disabled={!selectedCompany || !selectedRole}
                className="w-full px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-lg hover:shadow-lg disabled:opacity-50 transition"
              >
                Load Job ✓
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Job Title *</label>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g., Senior React Developer"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Company</label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g., Google, Microsoft"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Job URL</label>
          <input
            type="url"
            value={jobUrl}
            onChange={(e) => setJobUrl(e.target.value)}
            placeholder="https://jobs.example.com/..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Job Description *</label>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the complete job description here..."
            rows="8"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            required
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold py-3 rounded-lg hover:shadow-lg disabled:opacity-50 transition"
          >
            {loading ? "Analyzing..." : "Analyze Job Match"}
          </button>
          <button
            type="button"
            onClick={fetchSavedMatches}
            className="px-6 bg-gray-600 text-white font-semibold py-3 rounded-lg hover:bg-gray-700 transition"
          >
            View Saved ({savedMatches.length})
          </button>
        </div>
      </form>

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Score Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Match Score */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-700">Overall Match</h3>
                <span className="text-3xl font-bold text-blue-600">{result.matchScore}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all"
                  style={{ width: `${result.matchScore}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {result.matchScore >= 80 ? "Excellent match!" : result.matchScore >= 60 ? "Good match" : "Needs improvement"}
              </p>
            </div>

            {/* ATS Score */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-700">ATS Score</h3>
                <span className="text-3xl font-bold text-green-600">{result.atsScore}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all"
                  style={{ width: `${result.atsScore}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 mt-2">Application Tracking System compatibility</p>
            </div>

            {/* Career Alignment */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-700">Career Fit</h3>
                <span className="text-3xl font-bold text-purple-600">{result.careerAlignmentScore.overall}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all"
                  style={{ width: `${result.careerAlignmentScore.overall}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 mt-2">Experience & industry alignment</p>
            </div>
          </div>

          {/* Career Alignment Details */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Career Alignment Components</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(result.careerAlignmentScore.components).map(([key, value]) => (
                <div key={key} className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm font-semibold text-gray-600 capitalize mb-2">{key.replace(/([A-Z])/g, " $1")}</div>
                  <div className="text-2xl font-bold text-gray-800">{value}%</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Skills Match */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Skills Match ({result.skillsMatch.percentage}%)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-green-700 mb-3">✓ Skills You Have ({result.skillsMatch.matched.length})</h4>
                <div className="flex flex-wrap gap-2">
                  {result.skillsMatch.matched.map((skill, idx) => (
                    <span key={idx} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-red-700 mb-3">✗ Skills to Develop ({result.skillsMatch.missing.length})</h4>
                <div className="flex flex-wrap gap-2">
                  {result.skillsMatch.missing.map((skill, idx) => (
                    <span key={idx} className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Keywords Analysis */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">🔑 Keyword Analysis</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-700 mb-3">Required Keywords in Job ({result.keywords.required.length})</h4>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                  {result.keywords.required.slice(0, 10).map((kw, idx) => (
                    <span key={idx} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-orange-700 mb-3">Keywords Missing from Resume ({result.keywords.missing.length})</h4>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                  {result.keywords.suggestions.map((kw, idx) => (
                    <span key={idx} className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Strengths & Weaknesses */}
          {result.improvements && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">📊 Detailed Feedback</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-green-700 mb-3">Strengths</h4>
                  <ul className="space-y-2">
                    {result.improvements.strengths?.map((strength, idx) => (
                      <li key={idx} className="flex items-start text-sm text-gray-700">
                        <span className="text-green-600 font-bold mr-2">✓</span>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-red-700 mb-3">Areas for Improvement</h4>
                  <ul className="space-y-2">
                    {result.improvements.weaknesses?.map((weakness, idx) => (
                      <li key={idx} className="flex items-start text-sm text-gray-700">
                        <span className="text-red-600 font-bold mr-2">!</span>
                        <span>{weakness}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Action Items */}
          {result.improvements?.actionItems && result.improvements.actionItems.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">🎯 Action Items</h3>
              <ol className="space-y-3">
                {result.improvements.actionItems.map((action, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 flex-shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-gray-700">{action}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Suggested Resume Versions */}
          {result.suggestedVersions && result.suggestedVersions.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">📝 Suggested Resume Versions</h3>
              <div className="space-y-4">
                {result.suggestedVersions.map((version, idx) => (
                  <div key={idx} className="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500">
                    <h4 className="font-semibold text-gray-800 mb-2">{version.title}</h4>
                    <ul className="text-sm text-gray-700 space-y-1 mb-2">
                      {version.changes?.map((change, i) => (
                        <li key={i} className="flex items-start">
                          <span className="text-blue-600 mr-2">→</span>
                          <span>{change}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-gray-600 italic">Impact: {version.estimatedImpact}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Saved Matches */}
      {showSaved && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="sticky top-0 bg-white p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">Saved Job Matches</h3>
              <button onClick={() => setShowSaved(false)} className="text-gray-500 hover:text-gray-700 text-2xl">
                ✕
              </button>
            </div>

            <div className="p-6 space-y-3">
              {savedMatches.length === 0 ? (
                <p className="text-gray-600">No saved matches yet. Analyze a job to save it.</p>
              ) : (
                savedMatches.map((match) => (
                  <div key={match._id} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">{match.jobTitle}</h4>
                      <p className="text-sm text-gray-600">{match.company}</p>
                      <div className="flex gap-4 mt-2">
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Match: {match.matchScore}%</span>
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">ATS: {match.atsScore}%</span>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteMatch(match._id)}
                      className="text-red-600 hover:text-red-800 font-semibold text-sm"
                    >
                      Delete
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobMatcher;
