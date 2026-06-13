// ── Template definitions ──────────────────────────────────────────────────────
export const TEMPLATES = {
  classic: {
    id: "classic",
    name: "Classic",
    desc: "Traditional serif layout",
    thumb: "📄",
    style: {
      fontFamily: "'Georgia', 'Times New Roman', serif",
      fontSize: "11px",
      lineHeight: 1.55,
      color: "#1a1a2e",
      background: "#ffffff",
      padding: "40px 48px",
      accentColor: "#1a1a2e",
      headingSize: "22px",
      sectionColor: "#1a1a2e",
      borderStyle: "2px solid #1a1a2e",
      skillBg: "#f0f0f0",
      skillColor: "#1a1a2e",
      skillBorder: "1px solid #ccc",
    },
  },
  modern: {
    id: "modern",
    name: "Modern",
    desc: "Clean sans-serif with purple accents",
    thumb: "🎨",
    style: {
      fontFamily: "'Helvetica Neue', Arial, sans-serif",
      fontSize: "11px",
      lineHeight: 1.6,
      color: "#2d2d2d",
      background: "#ffffff",
      padding: "36px 44px",
      accentColor: "#6c63ff",
      headingSize: "20px",
      sectionColor: "#6c63ff",
      borderStyle: "2px solid #6c63ff",
      skillBg: "#f4f1ff",
      skillColor: "#5548e0",
      skillBorder: "1px solid #d4cff7",
    },
  },
  professional: {
    id: "professional",
    name: "Professional",
    desc: "Bold executive style with strong hierarchy",
    thumb: "💼",
    style: {
      fontFamily: "'Calibri', 'Segoe UI', sans-serif",
      fontSize: "11.5px",
      lineHeight: 1.65,
      color: "#111827",
      background: "#ffffff",
      padding: "44px 52px",
      accentColor: "#1e3a5f",
      headingSize: "24px",
      sectionColor: "#1e3a5f",
      borderStyle: "3px solid #1e3a5f",
      skillBg: "#e8f0fe",
      skillColor: "#1e3a5f",
      skillBorder: "1px solid #b8ccf4",
    },
  },
};

// ── Styled Live Preview ───────────────────────────────────────────────────────
export function StyledPreview({ sections, template }) {
  const t = template.style;

  const SectionHeader = ({ title }) => (
    <div style={{
      fontSize: "9px", fontWeight: 800, letterSpacing: "0.15em",
      textTransform: "uppercase", color: t.sectionColor,
      borderBottom: t.borderStyle, paddingBottom: "3px", marginBottom: "8px", marginTop: "14px",
    }}>
      {title}
    </div>
  );

  return (
    <div style={{
      fontFamily: t.fontFamily, fontSize: t.fontSize, lineHeight: t.lineHeight,
      color: t.color, background: t.background, padding: t.padding,
      minHeight: "100%", boxSizing: "border-box",
    }}>
      {/* Contact / Header */}
      {sections.contact && (
        <div style={{ marginBottom: "16px", textAlign: "center" }}>
          {sections.contact.split("\n").map((line, i) => (
            <div key={i} style={{
              fontSize: i === 0 ? t.headingSize : "10px",
              fontWeight: i === 0 ? 800 : 400,
              color: i === 0 ? t.accentColor : "#555",
              marginBottom: i === 0 ? "4px" : "2px",
            }}>{line}</div>
          ))}
        </div>
      )}

      {/* Summary */}
      {sections.summary && (
        <div>
          <SectionHeader title="Professional Summary" />
          <p style={{ fontSize: t.fontSize, color: t.color, margin: 0 }}>{sections.summary}</p>
        </div>
      )}

      {/* Experience */}
      {sections.experience.length > 0 && (
        <div>
          <SectionHeader title="Experience" />
          {sections.experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: "10px" }}>
              <div style={{ fontWeight: 700, fontSize: "11px" }}>{exp.title}</div>
              {exp.bullets.map((b, bi) => (
                <div key={bi} style={{ paddingLeft: "14px", color: "#444", marginTop: "2px" }}>
                  • {b}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Skills */}
      {sections.skills.length > 0 && (
        <div>
          <SectionHeader title="Skills" />
          <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
            {sections.skills.map((s, i) => (
              <span key={i} style={{
                background: t.skillBg, color: t.skillColor, border: t.skillBorder,
                padding: "2px 9px", borderRadius: "12px", fontSize: "10px", fontWeight: 600,
              }}>{s}</span>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {sections.education.length > 0 && (
        <div>
          <SectionHeader title="Education" />
          {sections.education.map((e, i) => <div key={i} style={{ marginBottom: "3px" }}>{e}</div>)}
        </div>
      )}

      {/* Projects */}
      {sections.projects.length > 0 && (
        <div>
          <SectionHeader title="Projects" />
          {sections.projects.map((p, i) => (
            <div key={i} style={{ marginBottom: "10px" }}>
              <div style={{ fontWeight: 700, fontSize: "11px" }}>{p.title}</div>
              {p.bullets.map((b, bi) => (
                <div key={bi} style={{ paddingLeft: "14px", color: "#444", marginTop: "2px" }}>• {b}</div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Certifications */}
      {sections.certifications.length > 0 && (
        <div>
          <SectionHeader title="Certifications" />
          {sections.certifications.map((c, i) => <div key={i} style={{ marginBottom: "3px" }}>{c}</div>)}
        </div>
      )}
    </div>
  );
}

// ── Generate downloadable HTML string ────────────────────────────────────────
export function buildResumeHTML(sections, template) {
  const t = template.style;

  const sectionHeader = (title) => `
    <div style="font-size:8px;font-weight:800;letter-spacing:0.15em;text-transform:uppercase;
      color:${t.sectionColor};border-bottom:${t.borderStyle};padding-bottom:3px;
      margin-bottom:8px;margin-top:14px;">${title}</div>`;

  const contactLines = (sections.contact || "").split("\n").map((line, i) =>
    `<div style="font-size:${i === 0 ? t.headingSize : "10px"};font-weight:${i === 0 ? 800 : 400};
      color:${i === 0 ? t.accentColor : "#555"};margin-bottom:${i === 0 ? "4px" : "2px"};">${line}</div>`
  ).join("");

  const experienceHTML = sections.experience.map(exp => `
    <div style="margin-bottom:10px;">
      <div style="font-weight:700;font-size:11px;">${exp.title}</div>
      ${exp.bullets.map(b => `<div style="padding-left:14px;color:#444;margin-top:2px;">• ${b}</div>`).join("")}
    </div>`).join("");

  const skillsHTML = sections.skills.map(s =>
    `<span style="background:${t.skillBg};color:${t.skillColor};border:${t.skillBorder};
      padding:2px 9px;border-radius:12px;font-size:10px;font-weight:600;
      display:inline-block;margin:3px;">${s}</span>`).join("");

  const projectsHTML = sections.projects.map(p => `
    <div style="margin-bottom:10px;">
      <div style="font-weight:700;font-size:11px;">${p.title}</div>
      ${p.bullets.map(b => `<div style="padding-left:14px;color:#444;margin-top:2px;">• ${b}</div>`).join("")}
    </div>`).join("");

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
  <title>Resume</title>
  <style>
    @media print { body { margin: 0; } }
    body { font-family:${t.fontFamily};font-size:${t.fontSize};line-height:${t.lineHeight};
      color:${t.color};background:${t.background};margin:0;padding:0; }
    .page { padding:${t.padding};max-width:820px;margin:0 auto;box-sizing:border-box; }
  </style>
</head><body><div class="page">
  ${sections.contact ? `<div style="margin-bottom:16px;text-align:center;">${contactLines}</div>` : ""}
  ${sections.summary ? sectionHeader("Professional Summary") + `<p style="margin:0;">${sections.summary}</p>` : ""}
  ${sections.experience.length ? sectionHeader("Experience") + experienceHTML : ""}
  ${sections.skills.length ? sectionHeader("Skills") + `<div style="display:flex;flex-wrap:wrap;gap:5px;">${skillsHTML}</div>` : ""}
  ${sections.education.length ? sectionHeader("Education") + sections.education.map(e => `<div style="margin-bottom:3px;">${e}</div>`).join("") : ""}
  ${sections.projects.length ? sectionHeader("Projects") + projectsHTML : ""}
  ${sections.certifications.length ? sectionHeader("Certifications") + sections.certifications.map(c => `<div style="margin-bottom:3px;">${c}</div>`).join("") : ""}
</div></body></html>`;
}
