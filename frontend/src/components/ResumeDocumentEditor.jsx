import { useState, useCallback, useEffect } from "react";
import { toast } from "react-hot-toast";
import axios from "axios";
import { TEMPLATES, StyledPreview, buildResumeHTML } from "./ResumeTemplates";
import BASE_URL from "../config/api";


/* ── parse plain text into sections ── */
export const parseResume = (text) => {
  const out = { contact: "", summary: "", experience: [], skills: [], education: [], projects: [], certifications: [] };
  if (!text) return out;
  const lines = text.split("\n");
  let mode = "contact";
  const match = (l, ...kw) => kw.some(k => l.toLowerCase().includes(k));
  lines.forEach(raw => {
    const l = raw.trim();
    if (!l) return;
    if (match(l, "professional experience", "work experience", "employment")) { mode = "experience"; return; }
    if (match(l, "technical skill", "core skill", "skills")) { mode = "skills"; return; }
    if (match(l, "education", "academic")) { mode = "education"; return; }
    if (match(l, "project")) { mode = "projects"; return; }
    if (match(l, "certification", "certificate", "license", "course")) { mode = "certifications"; return; }
    if (match(l, "professional summary", "summary", "objective", "profile", "about me")) { mode = "summary"; return; }
    if (match(l, "contact", "personal info")) { mode = "contact"; return; }
    if (mode === "skills") {
      l.split(/[,|•·]/).map(s => s.trim()).filter(Boolean).forEach(s => out.skills.push(s));
    } else if (mode === "experience" || mode === "projects") {
      const arr = out[mode];
      const isBullet = /^[-•·*]/.test(l);
      if (!isBullet && l.length < 90) { arr.push({ title: l, bullets: [] }); }
      else { if (!arr.length) arr.push({ title: "", bullets: [] }); arr[arr.length - 1].bullets.push(l.replace(/^[-•·*]\s*/, "")); }
    } else if (mode === "education" || mode === "certifications") {
      out[mode].push(l);
    } else if (mode === "contact") {
      out.contact += (out.contact ? "\n" : "") + l;
    } else {
      out.summary += (out.summary ? " " : "") + l;
    }
  });
  return out;
};

/* ── rebuild plain text ── */
export const rebuild = (s) => {
  let t = "";
  if (s.contact) t += "CONTACT INFORMATION\n" + s.contact + "\n\n";
  if (s.summary) t += "PROFESSIONAL SUMMARY\n" + s.summary + "\n\n";
  if (s.experience.length) { t += "PROFESSIONAL EXPERIENCE\n"; s.experience.forEach(e => { t += e.title + "\n"; e.bullets.forEach(b => { t += "• " + b + "\n"; }); t += "\n"; }); }
  if (s.skills.length) t += "TECHNICAL SKILLS\n" + s.skills.join(", ") + "\n\n";
  if (s.education.length) t += "EDUCATION\n" + s.education.join("\n") + "\n\n";
  if (s.projects.length) { t += "PROJECTS\n"; s.projects.forEach(p => { t += p.title + "\n"; p.bullets.forEach(b => { t += "• " + b + "\n"; }); t += "\n"; }); }
  if (s.certifications.length) t += "CERTIFICATIONS\n" + s.certifications.join("\n") + "\n\n";
  return t.trim();
};

/* ── sub-components ── */
const Field = ({ value, onChange, rows, placeholder, bold }) => {
  const cls = `w-full bg-[#f9f6f2] border border-[#e8e3dc] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#6c63ff] focus:ring-2 focus:ring-[#6c63ff]/15 transition-all ${bold ? "font-semibold" : ""}`;
  return rows
    ? <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows} placeholder={placeholder} className={cls + " resize-none"} />
    : <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={cls} />;
};

const AIBtn = ({ onClick, loading, label = "✨ Enhance with AI" }) => (
  <button onClick={onClick} disabled={loading}
    className="text-xs font-semibold bg-gradient-to-r from-[#6c63ff] to-[#9b59b6] text-white px-4 py-1.5 rounded-lg hover:shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5">
    {loading ? <><span className="inline-block animate-spin">⚙</span> Enhancing…</> : label}
  </button>
);

/* ── Template Thumbnail ── */
const TemplateThumbnail = ({ template, selected, onSelect }) => (
  <button onClick={() => onSelect(template.id)}
    className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all cursor-pointer ${selected ? "border-[#6c63ff] bg-[#f4f1ff] shadow-md" : "border-[#e8e3dc] bg-white hover:border-[#6c63ff]/40 hover:shadow-sm"}`}>
    <div className={`w-20 h-24 rounded-lg flex flex-col items-center justify-center text-2xl shadow-sm ${selected ? "bg-[#6c63ff]/10" : "bg-[#f4f1ee]"}`}>
      {template.thumb}
      <div className="w-12 h-1 bg-gray-300 rounded mt-2" />
      <div className="w-10 h-0.5 bg-gray-200 rounded mt-1" />
      <div className="w-12 h-0.5 bg-gray-200 rounded mt-1" />
      <div className="w-8 h-0.5 bg-gray-200 rounded mt-1" />
    </div>
    <span className={`text-xs font-bold ${selected ? "text-[#6c63ff]" : "text-[#5c5470]"}`}>{template.name}</span>
    <span className="text-[10px] text-[#9e9aa7] text-center leading-tight">{template.desc}</span>
    {selected && <span className="text-[9px] font-bold text-[#6c63ff] bg-[#e8e3ff] px-2 py-0.5 rounded-full">✓ Active</span>}
  </button>
);

/* ── main component ── */
function ResumeDocumentEditor({ resumeText, resumeId, resumeUrl, onSave }) {
  const [sections, setSections] = useState(() => parseResume(resumeText || ""));
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState({});
  const [tab, setTab] = useState("contact");
  const [previewMode, setPreviewMode] = useState("original");
  const [dirty, setDirty] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("modern");
  const [showTemplates, setShowTemplates] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    setSections(parseResume(resumeText || ""));
    setDirty(false);
  }, [resumeText]);

  const set = useCallback((key, val) => {
    setSections(prev => ({ ...prev, [key]: val }));
    setDirty(true);
    setPreviewMode("live");
  }, []);

  const setAI = (key, val) => setAiLoading(prev => ({ ...prev, [key]: val }));

  const parseStructuredSection = (text) => {
    const out = [];
    text.split("\n").forEach(raw => {
      const l = raw.trim();
      if (!l) return;
      if (!/^[-•·*]/.test(l) && l.length < 90) { out.push({ title: l, bullets: [] }); }
      else { if (!out.length) out.push({ title: "", bullets: [] }); out[out.length - 1].bullets.push(l.replace(/^[-•·*]\s*/, "")); }
    });
    return out;
  };

  const enhance = async (sectionKey, content) => {
    let text = "";
    if (Array.isArray(content)) {
      if (content.length > 0 && typeof content[0] === "object") {
        text = content.map(item => `${item.title || ""}\n${(item.bullets || []).map(b => `• ${b}`).join("\n")}`).join("\n\n");
      } else { text = content.join("\n"); }
    } else { text = String(content || ""); }
    if (!text.trim()) { toast.error("Section is empty"); return; }
    setAI(sectionKey, true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(`${BASE_URL}/analysis/${resumeId}/enhance-section`,
        { section: sectionKey, content: text },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        const enhanced = res.data.data.enhanced;
        if (sectionKey === "skills") { set("skills", enhanced.split(/[,\n]/).map(s => s.trim()).filter(Boolean)); }
        else if (sectionKey === "experience" || sectionKey === "projects") { set(sectionKey, parseStructuredSection(enhanced)); }
        else if (sectionKey === "education" || sectionKey === "certifications") { set(sectionKey, enhanced.split("\n").map(s => s.trim()).filter(Boolean)); }
        else { set(sectionKey, enhanced); }
        toast.success(`✨ ${sectionKey} enhanced!`);
      }
    } catch (err) { toast.error(err.response?.data?.message || "AI enhancement failed"); }
    finally { setAI(sectionKey, false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const content = rebuild(sections);
      const res = await axios.post(`${BASE_URL}/resume/${resumeId}/update-content`,
        { content }, { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        toast.success("✅ Resume saved!");
        setDirty(false);
        if (onSave) onSave(content); else window.location.reload();
      }
    } catch (err) { toast.error(err.response?.data?.message || "Save failed"); }
    finally { setSaving(false); }
  };

  const handleDownload = () => {
    setDownloading(true);
    try {
      const template = TEMPLATES[selectedTemplate];
      const html = buildResumeHTML(sections, template);
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `resume-${template.name.toLowerCase()}-${Date.now()}.html`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success(`📥 Downloaded with ${template.name} template! Open in browser → Print → Save as PDF`);
    } catch { toast.error("Download failed"); }
    finally { setDownloading(false); }
  };

  /* ── section editor panels ── */
  const EntryList = ({ sectionKey, entryLabel }) => {
    const entries = sections[sectionKey];
    const updTitle = (i, v) => { const c = [...entries]; c[i] = { ...c[i], title: v }; set(sectionKey, c); };
    const updBullet = (i, bi, v) => { const c = [...entries]; c[i].bullets[bi] = v; set(sectionKey, c); };
    const addBullet = i => { const c = [...entries]; c[i].bullets.push(""); set(sectionKey, c); };
    const rmBullet = (i, bi) => { const c = [...entries]; c[i].bullets.splice(bi, 1); set(sectionKey, c); };
    const addEntry = () => set(sectionKey, [...entries, { title: "", bullets: [""] }]);
    const rmEntry = i => set(sectionKey, entries.filter((_, idx) => idx !== i));
    return (
      <div className="space-y-4">
        {entries.map((entry, i) => (
          <div key={i} className="bg-[#f9f6f2] border border-[#e8e3dc] rounded-xl p-4 group relative">
            <button onClick={() => rmEntry(i)} className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-[#e05252] text-xs font-bold px-2 py-0.5 rounded hover:bg-[#fff1f1] transition-all">✕</button>
            <Field value={entry.title} onChange={v => updTitle(i, v)} placeholder={`${entryLabel} title / company…`} bold />
            <div className="mt-3 space-y-2">
              {entry.bullets.map((b, bi) => (
                <div key={bi} className="flex items-start gap-2">
                  <span className="text-[#6c63ff] mt-2 text-xs shrink-0">•</span>
                  <Field value={b} onChange={v => updBullet(i, bi, v)} placeholder="Achievement with impact & metrics…" />
                  <button onClick={() => rmBullet(i, bi)} className="text-[#e05252] text-xs mt-2 shrink-0 hover:text-[#c93d3d]">✕</button>
                </div>
              ))}
            </div>
            <button onClick={() => addBullet(i)} className="mt-2 text-xs text-[#6c63ff] font-semibold hover:text-[#5548e0] flex items-center gap-1">
              <span className="w-4 h-4 rounded-full bg-[#f4f1ff] flex items-center justify-center">+</span> Add bullet
            </button>
          </div>
        ))}
        <button onClick={addEntry} className="flex items-center gap-2 text-xs font-semibold text-[#6c63ff] hover:text-[#5548e0] mt-1">
          <span className="w-5 h-5 rounded-full bg-[#f4f1ff] flex items-center justify-center">+</span> Add {entryLabel}
        </button>
        <AIBtn onClick={() => enhance(sectionKey, entries)} loading={aiLoading[sectionKey]} />
      </div>
    );
  };

  const SimpleList = ({ sectionKey, placeholder }) => {
    const items = sections[sectionKey];
    return (
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <Field value={item} onChange={v => { const c = [...items]; c[i] = v; set(sectionKey, c); }} placeholder={placeholder} />
            <button onClick={() => set(sectionKey, items.filter((_, idx) => idx !== i))} className="text-[#e05252] text-xs font-bold px-2 py-1 rounded hover:bg-[#fff1f1] shrink-0">✕</button>
          </div>
        ))}
        <button onClick={() => set(sectionKey, [...items, ""])} className="text-xs font-semibold text-[#6c63ff] hover:text-[#5548e0] flex items-center gap-1 mt-1">
          <span className="w-4 h-4 rounded-full bg-[#f4f1ff] flex items-center justify-center">+</span> Add entry
        </button>
        <AIBtn onClick={() => enhance(sectionKey, items)} loading={aiLoading[sectionKey]} />
      </div>
    );
  };

  const SkillsPanel = () => {
    const [newSkill, setNewSkill] = useState("");
    const add = () => { const s = newSkill.trim(); if (!s) return; set("skills", [...sections.skills, s]); setNewSkill(""); };
    return (
      <div>
        <div className="flex flex-wrap gap-2 mb-4">
          {sections.skills.map((skill, i) => (
            <div key={i} className="flex items-center gap-1 bg-[#f4f1ff] border border-[#d4cff7] rounded-full px-3 py-1.5 group">
              <input type="text" value={skill} onChange={e => { const c = [...sections.skills]; c[i] = e.target.value; set("skills", c); }}
                className="text-xs font-semibold text-[#5548e0] bg-transparent outline-none" style={{ width: Math.max(30, skill.length * 7) + "px" }} />
              <button onClick={() => set("skills", sections.skills.filter((_, idx) => idx !== i))} className="text-[#e05252] text-xs opacity-0 group-hover:opacity-100 transition-opacity ml-1">✕</button>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mb-3">
          <input type="text" value={newSkill} onChange={e => setNewSkill(e.target.value)} onKeyDown={e => e.key === "Enter" && add()}
            placeholder="Type skill + Enter to add…" className="flex-1 bg-[#f9f6f2] border border-[#e8e3dc] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#6c63ff] focus:ring-2 focus:ring-[#6c63ff]/15 transition-all" />
          <button onClick={add} className="bg-[#2ecc8a] text-white text-sm font-semibold px-4 rounded-xl hover:bg-[#27ae76] transition-all">Add</button>
        </div>
        <AIBtn onClick={() => enhance("skills", sections.skills)} loading={aiLoading.skills} label="✨ Optimize Skills" />
      </div>
    );
  };

  const tabs = [
    { key: "contact", label: "Contact", icon: "👤" },
    { key: "summary", label: "Summary", icon: "📝" },
    { key: "experience", label: "Experience", icon: "💼" },
    { key: "skills", label: "Skills", icon: "🛠" },
    { key: "education", label: "Education", icon: "🎓" },
    { key: "projects", label: "Projects", icon: "🚀" },
    { key: "certifications", label: "Certs", icon: "🏅" },
  ];

  const renderEditor = () => {
    switch (tab) {
      case "contact": return (<div className="space-y-3"><Field value={sections.contact} onChange={v => set("contact", v)} rows={5} placeholder="Full name, email, phone, LinkedIn, location…" /><AIBtn onClick={() => enhance("contact", sections.contact)} loading={aiLoading.contact} /></div>);
      case "summary": return (<div className="space-y-3"><Field value={sections.summary} onChange={v => set("summary", v)} rows={6} placeholder="2–3 sentence ATS-optimised professional summary…" /><AIBtn onClick={() => enhance("summary", sections.summary)} loading={aiLoading.summary} /></div>);
      case "experience": return <EntryList sectionKey="experience" entryLabel="Job" />;
      case "skills": return <SkillsPanel />;
      case "education": return <SimpleList sectionKey="education" placeholder="Degree, Institution, Year, GPA…" />;
      case "projects": return <EntryList sectionKey="projects" entryLabel="Project" />;
      case "certifications": return <SimpleList sectionKey="certifications" placeholder="Certificate name, Issuer, Year…" />;
      default: return null;
    }
  };

  const pdfEmbedUrl = resumeUrl ? resumeUrl.replace("/upload/", "/upload/fl_attachment:false/") : null;
  const currentTemplate = TEMPLATES[selectedTemplate];

  return (
    <div>
      {/* ── TOP BAR ── */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-[#1a1a2e]">✏️ Edit Resume</h2>
          <p className="text-xs text-[#9e9aa7] mt-0.5">Choose a template · Edit sections · Download or Re-analyze</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {dirty && (
            <span className="text-xs font-semibold text-[#f0894d] bg-[#fff8f0] border border-[#fcd5a5] px-3 py-1 rounded-full">● Unsaved changes</span>
          )}
          <button onClick={handleDownload} disabled={downloading}
            className="bg-[#1a1a2e] text-white font-bold px-5 py-2.5 rounded-xl hover:bg-[#2d2d4a] hover:shadow-lg transition-all disabled:opacity-60 text-sm flex items-center gap-2">
            {downloading ? "⏳" : "📥"} Download Resume
          </button>
          <button onClick={handleSave} disabled={saving}
            className="bg-[#2ecc8a] text-white font-bold px-6 py-2.5 rounded-xl hover:bg-[#27ae76] hover:shadow-lg transition-all disabled:opacity-60 text-sm">
            {saving ? "⏳ Saving…" : "💾 Save Resume"}
          </button>
        </div>
      </div>

      {/* ── TEMPLATE CHOOSER ── */}
      <div className="mb-6 bg-gradient-to-br from-[#1a1a2e] to-[#2d2d4a] rounded-2xl overflow-hidden shadow-lg">
        <button onClick={() => setShowTemplates(v => !v)}
          className="w-full flex items-center justify-between px-6 py-4 text-white hover:bg-white/5 transition-all">
          <div className="flex items-center gap-3">
            <span className="text-xl">🎨</span>
            <div className="text-left">
              <p className="font-bold text-sm">Choose a Template</p>
              <p className="text-xs text-white/60">Currently: <span className="text-[#a78bfa] font-semibold">{currentTemplate.name}</span></p>
            </div>
          </div>
          <span className="text-white/60 text-lg">{showTemplates ? "▲" : "▼"}</span>
        </button>
        {showTemplates && (
          <div className="px-6 pb-6">
            <p className="text-xs text-white/50 mb-4">Select a template — the preview updates instantly. Download applies the template styling.</p>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {Object.values(TEMPLATES).map(tmpl => (
                <TemplateThumbnail key={tmpl.id} template={tmpl} selected={selectedTemplate === tmpl.id} onSelect={id => { setSelectedTemplate(id); setPreviewMode("live"); }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── TWO-COLUMN ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: editor */}
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {tabs.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${tab === t.key ? "bg-[#6c63ff] text-white shadow-md shadow-[#6c63ff]/30" : "bg-[#f4f1ff] text-[#6c63ff] hover:bg-[#e8e3ff]"}`}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
          <div className="bg-white border border-[#e8e3dc] rounded-2xl p-5 shadow-sm min-h-[380px]">
            <p className="text-[0.6rem] font-bold uppercase tracking-widest text-[#9e9aa7] mb-4">
              Editing: {tabs.find(t => t.key === tab)?.label}
            </p>
            {renderEditor()}
          </div>
          <div className="bg-[#f4f1ff] border border-[#d4cff7] rounded-xl p-3 text-xs text-[#5c5470] space-y-1">
            <p className="font-semibold text-[#5548e0]">💡 Tips</p>
            <p>• Selecting a template updates the live preview and the downloaded file</p>
            <p>• Use ✨ Enhance to let AI improve the section for ATS impact</p>
            <p>• After saving, go to Analysis to re-score with the new content</p>
          </div>
        </div>

        {/* RIGHT: preview */}
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 bg-[#f4f1ee] p-1.5 rounded-full">
              <button onClick={() => setPreviewMode("original")}
                className={`text-xs font-semibold px-4 py-1.5 rounded-full transition-all ${previewMode === "original" ? "bg-white text-[#6c63ff] shadow-sm" : "text-[#9e9aa7] hover:text-[#1a1a2e]"}`}>
                📄 Original PDF
              </button>
              <button onClick={() => setPreviewMode("live")}
                className={`text-xs font-semibold px-4 py-1.5 rounded-full transition-all ${previewMode === "live" ? "bg-white text-[#6c63ff] shadow-sm" : "text-[#9e9aa7] hover:text-[#1a1a2e]"}`}>
                ⚡ Live Preview
              </button>
            </div>
            {previewMode === "live" && (
              <span className="text-[10px] font-semibold text-white bg-[#6c63ff] px-3 py-1 rounded-full">
                {currentTemplate.thumb} {currentTemplate.name} Template
              </span>
            )}
          </div>

          <div className="border-2 border-[#d4cff7] rounded-2xl overflow-hidden" style={{ height: 640 }}>
            {previewMode === "original" ? (
              pdfEmbedUrl ? (
                <iframe src={pdfEmbedUrl} title="Uploaded Resume" className="w-full h-full" style={{ border: "none" }} />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-[#f9f6f2] text-[#9e9aa7]">
                  <p className="text-4xl mb-3">📄</p>
                  <p className="text-sm font-semibold">No PDF URL available</p>
                  <p className="text-xs mt-1">Switch to Live Preview to see your resume</p>
                </div>
              )
            ) : (
              <div className="w-full h-full overflow-y-auto bg-[#e8e3dc]">
                <div className="max-w-[680px] mx-auto my-4 shadow-2xl">
                  <StyledPreview sections={sections} template={currentTemplate} />
                </div>
              </div>
            )}
          </div>
          <p className="text-[0.6rem] text-[#b0aac0] text-center uppercase tracking-widest">
            {previewMode === "original" ? "Your uploaded document" : `Live preview — ${currentTemplate.name} template`}
          </p>
        </div>
      </div>
    </div>
  );
}

export default ResumeDocumentEditor;
