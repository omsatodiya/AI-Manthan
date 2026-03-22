import { Template } from "../index";

const sopOutline: Template = {
  id: "sop-outline-blueprint",
  title: "Standard operating procedure (SOP)",
  description:
    "Repeatable process doc: purpose, scope, roles, steps, and controls for day-to-day operations.",
  created_at: new Date().toISOString(),
  category: "operations-delivery",
  audience: "internal",
  htmlContent: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><title>SOP - {{text:sopTitle}}</title>
  <style>
    body { font-family: Georgia, serif; line-height: 1.7; color: #111827; max-width: 760px; margin: 0 auto; padding: 40px; }
    h1 { font-size: 1.6rem; margin-bottom: 0.25rem; }
    .meta { color: #6b7280; font-size: 0.95rem; margin-bottom: 1.5rem; }
    h2 { font-size: 1.1rem; margin-top: 1.75rem; color: #1f2937; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
    ol { padding-left: 1.35rem; }
    ul { padding-left: 1.25rem; }
  </style>
</head>
<body>
  <h1>Standard operating procedure</h1>
  <p class="meta">{{text:sopTitle}} · Version {{text:version}} · Owner: {{text:owner}}</p>
  <h2>1. Purpose</h2>
  <p>{{text:purpose}}</p>
  <h2>2. Scope</h2>
  <p>{{text:scope}}</p>
  <h2>3. Roles & responsibilities</h2>
  {{table:rolesTable}}
  <h2>4. Procedure</h2>
  <ol>{{points:procedureSteps}}</ol>
  <h2>5. Tools & references</h2>
  <ul>{{points:toolsBullets}}</ul>
  <h2>6. Exceptions & escalation</h2>
  <p>{{text:escalation}}</p>
  <h2>7. Revision history</h2>
  <p>{{text:revisionHistory}}</p>
</body>
</html>`,
  fields: [
    { key: "sopTitle", name: "SOP title", type: "input", placeholder: "Short name of the process" },
    { key: "version", name: "Version", type: "input", placeholder: "e.g. 1.2" },
    { key: "owner", name: "Process owner", type: "input", placeholder: "Team or role" },
    { key: "purpose", name: "Purpose", type: "textarea", placeholder: "Why this SOP exists; outcomes." },
    { key: "scope", name: "Scope", type: "textarea", placeholder: "What is in / out of scope." },
    { key: "rolesTable", name: "Roles (CSV)", type: "textarea", placeholder: "Role,Responsibility\\n…" },
    { key: "procedureSteps", name: "Procedure steps", type: "textarea", placeholder: "One numbered step per line." },
    { key: "toolsBullets", name: "Tools & references (bullets)", type: "textarea", placeholder: "Systems, links, forms; one per line." },
    { key: "escalation", name: "Exceptions & escalation", type: "textarea", placeholder: "When to deviate; who to contact." },
    { key: "revisionHistory", name: "Revision history", type: "textarea", placeholder: "Date, change, author." },
  ],
};

export default sopOutline;
