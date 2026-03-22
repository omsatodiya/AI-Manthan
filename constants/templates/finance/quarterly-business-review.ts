import { Template } from "../index";

const quarterlyBusinessReview: Template = {
  id: "quarterly-business-review-blueprint",
  title: "Quarterly business review (QBR)",
  description:
    "Internal QBR: results, pipeline or funnel, forecast, and corrective actions.",
  created_at: new Date().toISOString(),
  category: "finance-leadership",
  audience: "internal",
  htmlContent: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><title>QBR - {{text:quarterLabel}}</title>
  <style>
    body { font-family: Georgia, serif; line-height: 1.7; color: #111827; max-width: 760px; margin: 0 auto; padding: 40px; }
    h1 { font-size: 1.6rem; margin-bottom: 0.25rem; }
    .meta { color: #6b7280; font-size: 0.95rem; margin-bottom: 1.5rem; }
    h2 { font-size: 1.1rem; margin-top: 1.75rem; color: #1f2937; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 0.95rem; }
    th, td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; }
    th { background: #f9fafb; }
  </style>
</head>
<body>
  <h1>Quarterly business review</h1>
  <p class="meta">{{text:businessUnit}} · {{text:quarterLabel}}</p>
  <h2>1. Snapshot</h2>
  <p>{{text:snapshot}}</p>
  <h2>2. Results vs prior quarter</h2>
  {{table:resultsTable}}
  <h2>3. Drivers & commentary</h2>
  <p>{{text:drivers}}</p>
  <h2>4. Forecast & assumptions</h2>
  <p>{{text:forecast}}</p>
  <h2>5. Issues & actions</h2>
  <ul>{{points:actionsBullets}}</ul>
  <h2>6. Next quarter focus</h2>
  <p>{{text:nextQuarter}}</p>
</body>
</html>`,
  fields: [
    { key: "businessUnit", name: "Business unit / team", type: "input", placeholder: "e.g. EMEA Enterprise" },
    { key: "quarterLabel", name: "Quarter", type: "input", placeholder: "e.g. Q1 2025" },
    { key: "snapshot", name: "Snapshot", type: "textarea", placeholder: "Headline KPIs and one-line story." },
    { key: "resultsTable", name: "Results (CSV table)", type: "textarea", placeholder: "Metric,Actual,Plan,Variance\\n…" },
    { key: "drivers", name: "Drivers & commentary", type: "textarea", placeholder: "What moved the numbers." },
    { key: "forecast", name: "Forecast & assumptions", type: "textarea", placeholder: "Outlook and key assumptions." },
    { key: "actionsBullets", name: "Issues & actions (bullets)", type: "textarea", placeholder: "One bullet per line." },
    { key: "nextQuarter", name: "Next quarter focus", type: "textarea", placeholder: "Top priorities and success metrics." },
  ],
};

export default quarterlyBusinessReview;
