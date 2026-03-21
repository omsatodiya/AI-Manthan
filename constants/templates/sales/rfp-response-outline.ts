import { Template } from "../index";

const rfpResponseOutline: Template = {
  id: "rfp-response-outline-blueprint",
  title: "RFP response (outline)",
  description:
    "Structured response to an RFP: compliance matrix narrative, solution, and commercials summary.",
  created_at: new Date().toISOString(),
  category: "sales-revenue",
  audience: "external",
  htmlContent: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><title>RFP Response — {{text:rfpTitle}}</title>
  <style>
    body { font-family: system-ui, sans-serif; line-height: 1.55; color: #1f2937; max-width: 860px; margin: 0 auto; padding: 40px; }
    h1 { font-size: 1.65rem; }
    h2 { font-size: 1.1rem; margin-top: 26px; color: #111827; }
    table { width: 100%; border-collapse: collapse; margin: 14px 0; font-size: 0.9rem; }
    th, td { border: 1px solid #e5e7eb; padding: 8px; vertical-align: top; }
    th { background: #f9fafb; }
  </style>
</head>
<body>
  <h1>Response to RFP</h1>
  <p><strong>RFP:</strong> {{text:rfpTitle}}</p>
  <p><strong>Issuing organization:</strong> {{text:issuer}}</p>
  <p><strong>Respondent:</strong> {{text:respondent}}</p>
  <h2>1. Executive summary</h2>
  {{paragraphs:executiveSummary}}
  <h2>2. Understanding of requirements</h2>
  <p>{{text:requirementsUnderstanding}}</p>
  <h2>3. Proposed solution</h2>
  {{paragraphs:proposedSolution}}
  <h2>4. Requirements coverage (summary)</h2>
  {{table:complianceSummary}}
  <h2>5. Commercial summary</h2>
  <p>{{text:commercialSummary}}</p>
  <h2>6. Implementation plan</h2>
  <ul>{{points:implementationPlan}}</ul>
</body>
</html>`,
  fields: [
    { key: "rfpTitle", name: "RFP title / reference", type: "input", placeholder: "RFP name or ID" },
    { key: "issuer", name: "Issuing organization", type: "input", placeholder: "Buyer organization" },
    { key: "respondent", name: "Respondent (your org)", type: "input", placeholder: "Your company" },
    { key: "executiveSummary", name: "Executive summary", type: "textarea", placeholder: "Win themes and differentiators." },
    { key: "requirementsUnderstanding", name: "Requirements understanding", type: "textarea", placeholder: "How you interpret scope and priorities." },
    { key: "proposedSolution", name: "Proposed solution", type: "textarea", placeholder: "Architecture, services, product fit." },
    { key: "complianceSummary", name: "Compliance table (CSV)", type: "textarea", placeholder: "Req ID,Response,Evidence\\n…" },
    { key: "commercialSummary", name: "Commercial summary", type: "textarea", placeholder: "Pricing model, totals, term." },
    { key: "implementationPlan", name: "Implementation plan", type: "textarea", placeholder: "Phases or workstreams, one per line." },
  ],
};

export default rfpResponseOutline;
