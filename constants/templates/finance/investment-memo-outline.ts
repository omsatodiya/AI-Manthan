import { Template } from "../index";

const investmentMemoOutline: Template = {
  id: "investment-memo-outline-blueprint",
  title: "Investment memo",
  description:
    "Decision memo for a project, M&A, or capex: thesis, economics, risks, and recommendation.",
  created_at: new Date().toISOString(),
  category: "finance-leadership",
  audience: "internal",
  htmlContent: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><title>Investment memo - {{text:dealName}}</title>
  <style>
    body { font-family: Georgia, serif; line-height: 1.7; color: #111827; max-width: 760px; margin: 0 auto; padding: 40px; }
    h1 { font-size: 1.6rem; margin-bottom: 0.25rem; }
    .meta { color: #6b7280; font-size: 0.95rem; margin-bottom: 1.5rem; }
    h2 { font-size: 1.1rem; margin-top: 1.75rem; color: #1f2937; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
    ul { padding-left: 1.25rem; }
  </style>
</head>
<body>
  <h1>Investment memo</h1>
  <p class="meta">{{text:dealName}} · {{text:memoDate}} · Prepared by {{text:author}}</p>
  <h2>Investment thesis</h2>
  <p>{{text:thesis}}</p>
  <h2>Strategic fit</h2>
  <p>{{text:strategicFit}}</p>
  <h2>Financial overview</h2>
  <p>{{text:financialOverview}}</p>
  <h2>Key assumptions & sensitivities</h2>
  <ul>{{points:assumptionsBullets}}</ul>
  <h2>Risks & mitigations</h2>
  <p>{{text:risks}}</p>
  <h2>Recommendation</h2>
  <p>{{text:recommendation}}</p>
  <h2>Approval & next steps</h2>
  {{paragraphs:nextSteps}}</body>
</html>`,
  fields: [
    { key: "dealName", name: "Investment / deal name", type: "input", placeholder: "Short title" },
    { key: "memoDate", name: "Date", type: "input", placeholder: "e.g. 22 Mar 2025" },
    { key: "author", name: "Prepared by", type: "input", placeholder: "Name or team" },
    { key: "thesis", name: "Investment thesis", type: "textarea", placeholder: "Why this investment creates value." },
    { key: "strategicFit", name: "Strategic fit", type: "textarea", placeholder: "Alignment with company strategy." },
    { key: "financialOverview", name: "Financial overview", type: "textarea", placeholder: "Spend, returns, payback, NPV if applicable." },
    { key: "assumptionsBullets", name: "Assumptions (bullets)", type: "textarea", placeholder: "One assumption per line." },
    { key: "risks", name: "Risks & mitigations", type: "textarea", placeholder: "Material risks and how they are managed." },
    { key: "recommendation", name: "Recommendation", type: "textarea", placeholder: "Approve / reject / defer with rationale." },
    { key: "nextSteps", name: "Next steps", type: "textarea", placeholder: "Approvals, diligence, closing items." },
  ],
};

export default investmentMemoOutline;
