import { Template } from "../index";

const discoverySummary: Template = {
  id: "discovery-summary-blueprint",
  title: "Discovery & qualification summary",
  description:
    "Internal or external recap after discovery: account, pain, process, stakeholders, and fit.",
  created_at: new Date().toISOString(),
  category: "sales-revenue",
  audience: "either",
  htmlContent: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><title>Discovery — {{text:accountName}}</title>
  <style>
    body { font-family: Georgia, serif; line-height: 1.65; color: #222; max-width: 800px; margin: 0 auto; padding: 36px; }
    h1 { font-size: 1.6rem; }
    h2 { font-size: 1.1rem; margin-top: 24px; color: #444; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
    ul { padding-left: 1.2rem; }
  </style>
</head>
<body>
  <h1>Discovery summary</h1>
  <p><strong>Account:</strong> {{text:accountName}}</p>
  <p><strong>Opportunity:</strong> {{text:opportunityName}}</p>
  <h2>Current situation</h2>
  <p>{{text:currentSituation}}</p>
  <h2>Pain & impact</h2>
  <ul>{{points:painPoints}}</ul>
  <h2>Stakeholders</h2>
  {{table:stakeholders}}
  <h2>Process & timeline</h2>
  <p>{{text:buyingProcess}}</p>
  <h2>Fit & risks</h2>
  {{paragraphs:fitAndRisks}}
  <h2>Recommended next actions</h2>
  <ul>{{points:nextActions}}</ul>
</body>
</html>`,
  fields: [
    { key: "accountName", name: "Account name", type: "input", placeholder: "Company" },
    { key: "opportunityName", name: "Opportunity / deal name", type: "input", placeholder: "Short label" },
    { key: "currentSituation", name: "Current situation", type: "textarea", placeholder: "What they do today; relevant stack or vendors." },
    { key: "painPoints", name: "Pain points", type: "textarea", placeholder: "Bullets or short lines." },
    { key: "stakeholders", name: "Stakeholders (CSV)", type: "textarea", placeholder: "Name,Role,Attitude\\n…" },
    { key: "buyingProcess", name: "Buying process", type: "textarea", placeholder: "Steps, decision criteria, expected close." },
    { key: "fitAndRisks", name: "Fit & risks", type: "textarea", placeholder: "Why we win; red flags." },
    { key: "nextActions", name: "Next actions", type: "textarea", placeholder: "Concrete follow-ups." },
  ],
};

export default discoverySummary;
