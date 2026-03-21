import { Template } from "../index";

const sowOutline: Template = {
  id: "sow-outline-blueprint",
  title: "Statement of work (outline)",
  description:
    "External SOW-style outline: deliverables, milestones, assumptions, and out of scope.",
  created_at: new Date().toISOString(),
  category: "sales-revenue",
  audience: "external",
  htmlContent: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><title>SOW - {{text:projectTitle}}</title>
  <style>
    body { font-family: 'Segoe UI', sans-serif; line-height: 1.55; color: #111; max-width: 840px; margin: 0 auto; padding: 40px; }
    h1 { font-size: 1.5rem; }
    h2 { font-size: 1.05rem; margin-top: 22px; text-transform: uppercase; letter-spacing: 0.04em; color: #333; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 0.92rem; }
    th, td { border: 1px solid #ccc; padding: 8px; }
    th { background: #f3f4f6; }
  </style>
</head>
<body>
  <h1>Statement of work</h1>
  <p><strong>Project:</strong> {{text:projectTitle}}</p>
  <p><strong>Client:</strong> {{text:clientName}}</p>
  <p><strong>Provider:</strong> {{text:providerName}}</p>
  <h2>1. Purpose</h2>
  <p>{{text:purpose}}</p>
  <h2>2. Deliverables</h2>
  <ul>{{points:deliverables}}</ul>
  <h2>3. Milestones</h2>
  {{table:milestones}}
  <h2>4. Client responsibilities</h2>
  {{paragraphs:clientResp}}
  <h2>5. Assumptions</h2>
  <ul>{{points:assumptions}}</ul>
  <h2>6. Out of scope</h2>
  <ul>{{points:outOfScope}}</ul>
</body>
</html>`,
  fields: [
    { key: "projectTitle", name: "Project title", type: "input", placeholder: "Engagement name" },
    { key: "clientName", name: "Client", type: "input", placeholder: "Client legal name" },
    { key: "providerName", name: "Provider", type: "input", placeholder: "Your company" },
    { key: "purpose", name: "Purpose", type: "textarea", placeholder: "What this engagement achieves." },
    { key: "deliverables", name: "Deliverables", type: "textarea", placeholder: "One bullet per line." },
    { key: "milestones", name: "Milestones (CSV)", type: "textarea", placeholder: "Milestone,Target date,Owner\\n…" },
    { key: "clientResp", name: "Client responsibilities", type: "textarea", placeholder: "Access, data, approvals." },
    { key: "assumptions", name: "Assumptions", type: "textarea", placeholder: "Dependencies and constraints." },
    { key: "outOfScope", name: "Out of scope", type: "textarea", placeholder: "Explicit exclusions." },
  ],
};

export default sowOutline;
