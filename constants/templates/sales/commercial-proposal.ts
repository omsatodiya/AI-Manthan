import { Template } from "../index";

const commercialProposal: Template = {
  id: "commercial-proposal-blueprint",
  title: "Commercial proposal",
  description:
    "Client-facing proposal: situation, offer, scope, commercial terms, and next steps.",
  created_at: new Date().toISOString(),
  category: "sales-revenue",
  audience: "external",
  htmlContent: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><title>Proposal — {{text:clientName}}</title>
  <style>
    body { font-family: system-ui, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 820px; margin: 0 auto; padding: 40px; }
    h1 { font-size: 1.75rem; border-bottom: 2px solid #2563eb; padding-bottom: 8px; }
    h2 { font-size: 1.15rem; margin-top: 28px; color: #1e40af; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 0.95rem; }
    th, td { border: 1px solid #e5e7eb; padding: 10px; text-align: left; }
    th { background: #f8fafc; }
  </style>
</head>
<body>
  <p><strong>Prepared for:</strong> {{text:clientName}}</p>
  <p><strong>Prepared by:</strong> {{text:sellerName}}</p>
  <p><strong>Date:</strong> {{text:proposalDate}}</p>
  <h1>Commercial proposal</h1>
  <h2>1. Situation & objectives</h2>
  <p>{{text:situation}}</p>
  <h2>2. Recommended approach</h2>
  <p>{{text:approach}}</p>
  <h2>3. Scope of work</h2>
  <ul>{{points:scopeBullets}}</ul>
  <h2>4. Investment & terms</h2>
  {{table:commercialTable}}
  <h2>5. Timeline</h2>
  <p>{{text:timeline}}</p>
  <h2>6. Next steps</h2>
  {{paragraphs:nextSteps}}
</body>
</html>`,
  fields: [
    { key: "clientName", name: "Client name", type: "input", placeholder: "Legal or brand name" },
    { key: "sellerName", name: "Your company", type: "input", placeholder: "Your organization" },
    { key: "proposalDate", name: "Proposal date", type: "input", placeholder: "e.g. 22 Mar 2025" },
    { key: "situation", name: "Situation & objectives", type: "textarea", placeholder: "Context, goals, success criteria." },
    { key: "approach", name: "Recommended approach", type: "textarea", placeholder: "How you will solve it; high-level methodology." },
    { key: "scopeBullets", name: "Scope (bullets)", type: "textarea", placeholder: "Major deliverables or workstreams, one per line." },
    { key: "commercialTable", name: "Commercial summary (CSV)", type: "textarea", placeholder: "Item,Amount,Notes\\nPhase 1,…,…" },
    { key: "timeline", name: "Timeline", type: "textarea", placeholder: "Key milestones and dates." },
    { key: "nextSteps", name: "Next steps", type: "textarea", placeholder: "Signatures, kickoff, stakeholders." },
  ],
};

export default commercialProposal;
