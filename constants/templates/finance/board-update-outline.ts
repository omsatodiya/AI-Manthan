import { Template } from "../index";

const boardUpdateOutline: Template = {
  id: "board-update-outline-blueprint",
  title: "Board / investor update",
  description:
    "Concise narrative for directors or investors: performance, risks, capital, and asks.",
  created_at: new Date().toISOString(),
  category: "finance-leadership",
  audience: "external",
  htmlContent: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><title>Board update - {{text:period}}</title>
  <style>
    body { font-family: Georgia, serif; line-height: 1.7; color: #111827; max-width: 760px; margin: 0 auto; padding: 40px; }
    h1 { font-size: 1.6rem; margin-bottom: 0.25rem; }
    .meta { color: #6b7280; font-size: 0.95rem; margin-bottom: 1.5rem; }
    h2 { font-size: 1.1rem; margin-top: 1.75rem; color: #1f2937; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
    ul { padding-left: 1.25rem; }
  </style>
</head>
<body>
  <h1>Board update</h1>
  <p class="meta">{{text:companyName}} · {{text:period}} · Confidential</p>
  <h2>Executive summary</h2>
  <p>{{text:executiveSummary}}</p>
  <h2>Performance vs plan</h2>
  <p>{{text:performance}}</p>
  <h2>Cash & runway</h2>
  <p>{{text:cashRunway}}</p>
  <h2>Risks & mitigations</h2>
  <ul>{{points:risksBullets}}</ul>
  <h2>Strategic priorities</h2>
  <p>{{text:priorities}}</p>
  <h2>Asks / decisions</h2>
  {{paragraphs:asks}}</body>
</html>`,
  fields: [
    { key: "companyName", name: "Company", type: "input", placeholder: "Legal or brand name" },
    { key: "period", name: "Period", type: "input", placeholder: "e.g. Q1 FY26" },
    { key: "executiveSummary", name: "Executive summary", type: "textarea", placeholder: "3–5 sentences: headline results and outlook." },
    { key: "performance", name: "Performance vs plan", type: "textarea", placeholder: "Revenue, margin, unit economics; variance drivers." },
    { key: "cashRunway", name: "Cash & runway", type: "textarea", placeholder: "Cash position, burn, runway, financing." },
    { key: "risksBullets", name: "Risks (bullets)", type: "textarea", placeholder: "One risk per line; keep each line short." },
    { key: "priorities", name: "Strategic priorities", type: "textarea", placeholder: "What leadership is focused on next." },
    { key: "asks", name: "Asks / decisions", type: "textarea", placeholder: "What you need from the board; one paragraph per ask." },
  ],
};

export default boardUpdateOutline;
