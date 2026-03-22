import { Template } from "../index";

const deliveryRunbookOutline: Template = {
  id: "delivery-runbook-outline-blueprint",
  title: "Delivery runbook",
  description:
    "Operational checklist for releases or handoffs: prerequisites, steps, validation, and rollback.",
  created_at: new Date().toISOString(),
  category: "operations-delivery",
  audience: "internal",
  htmlContent: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><title>Runbook - {{text:runbookTitle}}</title>
  <style>
    body { font-family: Georgia, serif; line-height: 1.7; color: #111827; max-width: 760px; margin: 0 auto; padding: 40px; }
    h1 { font-size: 1.6rem; margin-bottom: 0.25rem; }
    .meta { color: #6b7280; font-size: 0.95rem; margin-bottom: 1.5rem; }
    h2 { font-size: 1.1rem; margin-top: 1.75rem; color: #1f2937; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
    ul { padding-left: 1.25rem; }
  </style>
</head>
<body>
  <h1>Delivery runbook</h1>
  <p class="meta">{{text:runbookTitle}} · Owner: {{text:owner}} · Version {{text:version}}</p>
  <h2>Overview</h2>
  <p>{{text:overview}}</p>
  <h2>Prerequisites</h2>
  <ul>{{points:prerequisites}}</ul>
  <h2>Execution steps</h2>
  <ol>{{points:executionSteps}}</ol>
  <h2>Validation</h2>
  <ul>{{points:validationChecks}}</ul>
  <h2>Rollback</h2>
  <p>{{text:rollback}}</p>
  <h2>Contacts & escalation</h2>
  {{table:contactsTable}}
  <h2>References</h2>
  <ul>{{points:referencesBullets}}</ul>
</body>
</html>`,
  fields: [
    { key: "runbookTitle", name: "Runbook title", type: "input", placeholder: "e.g. Production release v2.3" },
    { key: "owner", name: "Owner", type: "input", placeholder: "Team or on-call" },
    { key: "version", name: "Version", type: "input", placeholder: "e.g. 1.0" },
    { key: "overview", name: "Overview", type: "textarea", placeholder: "What this runbook covers; expected duration." },
    { key: "prerequisites", name: "Prerequisites (bullets)", type: "textarea", placeholder: "Access, flags, backups; one per line." },
    { key: "executionSteps", name: "Execution steps", type: "textarea", placeholder: "One step per line (rendered as ordered list)." },
    { key: "validationChecks", name: "Validation (bullets)", type: "textarea", placeholder: "Smoke tests, metrics, sign-off." },
    { key: "rollback", name: "Rollback", type: "textarea", placeholder: "How to revert; data considerations." },
    { key: "contactsTable", name: "Contacts (CSV)", type: "textarea", placeholder: "Role,Name,Channel\\n…" },
    { key: "referencesBullets", name: "References (bullets)", type: "textarea", placeholder: "Dashboards, tickets, docs." },
  ],
};

export default deliveryRunbookOutline;
