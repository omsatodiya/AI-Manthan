import { Template } from "../index";

const vendorAssessmentOutline: Template = {
  id: "vendor-assessment-outline-blueprint",
  title: "Vendor assessment",
  description:
    "Evaluate a supplier or partner: requirements fit, commercial terms, risk, and recommendation.",
  created_at: new Date().toISOString(),
  category: "operations-delivery",
  audience: "either",
  htmlContent: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><title>Vendor assessment - {{text:vendorName}}</title>
  <style>
    body { font-family: Georgia, serif; line-height: 1.7; color: #111827; max-width: 760px; margin: 0 auto; padding: 40px; }
    h1 { font-size: 1.6rem; margin-bottom: 0.25rem; }
    .meta { color: #6b7280; font-size: 0.95rem; margin-bottom: 1.5rem; }
    h2 { font-size: 1.1rem; margin-top: 1.75rem; color: #1f2937; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
    ul { padding-left: 1.25rem; }
  </style>
</head>
<body>
  <h1>Vendor assessment</h1>
  <p class="meta">{{text:vendorName}} · Category: {{text:category}} · {{text:assessmentDate}}</p>
  <h2>Business need</h2>
  <p>{{text:businessNeed}}</p>
  <h2>Requirements checklist</h2>
  {{table:requirementsMatrix}}
  <h2>Commercial summary</h2>
  <p>{{text:commercial}}</p>
  <h2>Security & compliance</h2>
  <p>{{text:compliance}}</p>
  <h2>Risks & mitigations</h2>
  <ul>{{points:risksBullets}}</ul>
  <h2>Recommendation</h2>
  <p>{{text:recommendation}}</p>
  <h2>Next steps</h2>
  {{paragraphs:nextSteps}}</body>
</html>`,
  fields: [
    { key: "vendorName", name: "Vendor name", type: "input", placeholder: "Legal or product name" },
    { key: "category", name: "Category", type: "input", placeholder: "e.g. Cloud hosting, payroll" },
    { key: "assessmentDate", name: "Assessment date", type: "input", placeholder: "e.g. 22 Mar 2025" },
    { key: "businessNeed", name: "Business need", type: "textarea", placeholder: "What you are buying and why." },
    { key: "requirementsMatrix", name: "Requirements matrix (CSV)", type: "textarea", placeholder: "Requirement,Priority,Vendor fit\\n…" },
    { key: "commercial", name: "Commercial summary", type: "textarea", placeholder: "Pricing model, contract term, ramps." },
    { key: "compliance", name: "Security & compliance", type: "textarea", placeholder: "Certifications, DPA, data residency." },
    { key: "risksBullets", name: "Risks (bullets)", type: "textarea", placeholder: "One risk per line." },
    { key: "recommendation", name: "Recommendation", type: "textarea", placeholder: "Award, shortlist, or no-go." },
    { key: "nextSteps", name: "Next steps", type: "textarea", placeholder: "Legal, POC, rollout." },
  ],
};

export default vendorAssessmentOutline;
