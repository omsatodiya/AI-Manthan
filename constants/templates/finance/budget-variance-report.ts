import { Template } from "../index";

const budgetVarianceReport: Template = {
  id: "budget-variance-report-blueprint",
  title: "Budget & variance report",
  description:
    "Plan vs actual by cost center or category, with variance explanations and outlook.",
  created_at: new Date().toISOString(),
  category: "finance-leadership",
  audience: "internal",
  htmlContent: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><title>Budget variance - {{text:reportPeriod}}</title>
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
  <h1>Budget & variance report</h1>
  <p class="meta">{{text:entityName}} · {{text:reportPeriod}} · Base currency: {{text:currency}}</p>
  <h2>Summary</h2>
  <p>{{text:summary}}</p>
  <h2>Variance by category</h2>
  {{table:varianceTable}}
  <h2>Key variances explained</h2>
  <p>{{text:varianceNarrative}}</p>
  <h2>Outlook & reforecast</h2>
  <p>{{text:outlook}}</p>
  <h2>Actions & ownership</h2>
  <ul>{{points:actionBullets}}</ul>
</body>
</html>`,
  fields: [
    { key: "entityName", name: "Entity / scope", type: "input", placeholder: "e.g. Group consolidated" },
    { key: "reportPeriod", name: "Period", type: "input", placeholder: "e.g. YTD Mar 2025" },
    { key: "currency", name: "Currency", type: "input", placeholder: "e.g. USD" },
    { key: "summary", name: "Executive summary", type: "textarea", placeholder: "Net variance vs plan in one short paragraph." },
    { key: "varianceTable", name: "Variance table (CSV)", type: "textarea", placeholder: "Category,Budget,Actual,Variance\\n…" },
    { key: "varianceNarrative", name: "Variance narrative", type: "textarea", placeholder: "Material line items and why they diverged." },
    { key: "outlook", name: "Outlook & reforecast", type: "textarea", placeholder: "Expected catch-up or further drift." },
    { key: "actionBullets", name: "Actions (bullets)", type: "textarea", placeholder: "Owner and action, one per line." },
  ],
};

export default budgetVarianceReport;
