import { Template } from "../index";

const incidentPostmortemOutline: Template = {
  id: "incident-postmortem-outline-blueprint",
  title: "Incident postmortem",
  description:
    "Blameless review: timeline, impact, root cause, mitigations, and follow-up actions.",
  created_at: new Date().toISOString(),
  category: "operations-delivery",
  audience: "internal",
  htmlContent: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><title>Postmortem - {{text:incidentId}}</title>
  <style>
    body { font-family: Georgia, serif; line-height: 1.7; color: #111827; max-width: 760px; margin: 0 auto; padding: 40px; }
    h1 { font-size: 1.6rem; margin-bottom: 0.25rem; }
    .meta { color: #6b7280; font-size: 0.95rem; margin-bottom: 1.5rem; }
    h2 { font-size: 1.1rem; margin-top: 1.75rem; color: #1f2937; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
    ul { padding-left: 1.25rem; }
  </style>
</head>
<body>
  <h1>Incident postmortem</h1>
  <p class="meta">{{text:incidentTitle}} · ID {{text:incidentId}} · Severity {{text:severity}} · {{text:incidentDate}}</p>
  <h2>Summary</h2>
  <p>{{text:summary}}</p>
  <h2>Impact</h2>
  <p>{{text:impact}}</p>
  <h2>Timeline</h2>
  {{table:timelineTable}}
  <h2>Root cause</h2>
  <p>{{text:rootCause}}</p>
  <h2>What went well</h2>
  <ul>{{points:wentWell}}</ul>
  <h2>What to improve</h2>
  <ul>{{points:toImprove}}</ul>
  <h2>Action items</h2>
  {{table:actionItems}}
  <h2>Lessons learned</h2>
  <p>{{text:lessons}}</p>
</body>
</html>`,
  fields: [
    { key: "incidentTitle", name: "Incident title", type: "input", placeholder: "Short description" },
    { key: "incidentId", name: "Incident ID", type: "input", placeholder: "e.g. INC-2025-042" },
    { key: "severity", name: "Severity", type: "input", placeholder: "e.g. SEV2" },
    { key: "incidentDate", name: "Date", type: "input", placeholder: "When it occurred" },
    { key: "summary", name: "Summary", type: "textarea", placeholder: "What happened in a few sentences." },
    { key: "impact", name: "Impact", type: "textarea", placeholder: "Users, revenue, SLA, duration." },
    { key: "timelineTable", name: "Timeline (CSV)", type: "textarea", placeholder: "Time (UTC),Event\\n…" },
    { key: "rootCause", name: "Root cause", type: "textarea", placeholder: "Contributing factors and trigger." },
    { key: "wentWell", name: "What went well (bullets)", type: "textarea", placeholder: "One bullet per line." },
    { key: "toImprove", name: "What to improve (bullets)", type: "textarea", placeholder: "One bullet per line." },
    { key: "actionItems", name: "Action items (CSV)", type: "textarea", placeholder: "Action,Owner,Due date,Status\\n…" },
    { key: "lessons", name: "Lessons learned", type: "textarea", placeholder: "Closing narrative." },
  ],
};

export default incidentPostmortemOutline;
