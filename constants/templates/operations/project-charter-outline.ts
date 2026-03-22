import { Template } from "../index";

const projectCharterOutline: Template = {
  id: "project-charter-outline-blueprint",
  title: "Project charter",
  description:
    "Kickoff doc: goals, scope, milestones, RACI, success metrics, and constraints for delivery.",
  created_at: new Date().toISOString(),
  category: "operations-delivery",
  audience: "internal",
  htmlContent: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><title>Charter - {{text:projectName}}</title>
  <style>
    body { font-family: Georgia, serif; line-height: 1.7; color: #111827; max-width: 760px; margin: 0 auto; padding: 40px; }
    h1 { font-size: 1.6rem; margin-bottom: 0.25rem; }
    .meta { color: #6b7280; font-size: 0.95rem; margin-bottom: 1.5rem; }
    h2 { font-size: 1.1rem; margin-top: 1.75rem; color: #1f2937; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
    ul { padding-left: 1.25rem; }
  </style>
</head>
<body>
  <h1>Project charter</h1>
  <p class="meta">{{text:projectName}} · Sponsor: {{text:sponsor}} · {{text:charterDate}}</p>
  <h2>1. Problem & goals</h2>
  <p>{{text:goals}}</p>
  <h2>2. In scope / out of scope</h2>
  <p>{{text:scope}}</p>
  <h2>3. Deliverables & milestones</h2>
  {{table:milestones}}
  <h2>4. Stakeholders & RACI</h2>
  {{table:raciTable}}
  <h2>5. Success metrics</h2>
  <ul>{{points:successMetrics}}</ul>
  <h2>6. Risks & dependencies</h2>
  {{paragraphs:risks}}
  <h2>7. Communication & cadence</h2>
  <p>{{text:communication}}</p>
</body>
</html>`,
  fields: [
    { key: "projectName", name: "Project name", type: "input", placeholder: "Short title" },
    { key: "sponsor", name: "Executive sponsor", type: "input", placeholder: "Name or role" },
    { key: "charterDate", name: "Date", type: "input", placeholder: "e.g. 22 Mar 2025" },
    { key: "goals", name: "Problem & goals", type: "textarea", placeholder: "What problem is solved; measurable outcomes." },
    { key: "scope", name: "In scope / out of scope", type: "textarea", placeholder: "Boundaries and assumptions." },
    { key: "milestones", name: "Milestones (CSV)", type: "textarea", placeholder: "Milestone,Target date,Owner\\n…" },
    { key: "raciTable", name: "RACI (CSV)", type: "textarea", placeholder: "Activity,R,A,C,I\\n…" },
    { key: "successMetrics", name: "Success metrics (bullets)", type: "textarea", placeholder: "One metric per line." },
    { key: "risks", name: "Risks & dependencies", type: "textarea", placeholder: "Paragraphs separated by blank lines." },
    { key: "communication", name: "Communication & cadence", type: "textarea", placeholder: "Standups, reviews, tooling." },
  ],
};

export default projectCharterOutline;
