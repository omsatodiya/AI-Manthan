import { Template } from "../index";

const internalDealBrief: Template = {
  id: "internal-deal-brief-blueprint",
  title: "Internal deal brief",
  description:
    "Internal alignment memo: account context, strategy, risks, and what you need from leadership or delivery.",
  created_at: new Date().toISOString(),
  category: "sales-revenue",
  audience: "internal",
  htmlContent: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><title>Deal brief - {{text:dealName}}</title>
  <style>
    body { font-family: system-ui, sans-serif; line-height: 1.6; color: #111; max-width: 780px; margin: 0 auto; padding: 36px; background: #fafafa; }
    .box { background: #fff; padding: 28px; border-radius: 8px; border: 1px solid #e5e5e5; }
    h1 { font-size: 1.45rem; margin-top: 0; }
    h2 { font-size: 1rem; margin-top: 22px; color: #374151; }
  </style>
</head>
<body>
  <div class="box">
    <h1>Internal deal brief</h1>
    <p><strong>Deal:</strong> {{text:dealName}}</p>
    <p><strong>Owner:</strong> {{text:dealOwner}}</p>
    <p><strong>Stage / ARR signal:</strong> {{text:stageAndValue}}</p>
    <h2>Account & context</h2>
    <p>{{text:accountContext}}</p>
    <h2>Strategy to win</h2>
    {{paragraphs:winStrategy}}
    <h2>Competition & landmines</h2>
    <ul>{{points:competition}}</ul>
    <h2>Risks & mitigations</h2>
    {{paragraphs:risks}}
    <h2>Asks (internal)</h2>
    <ul>{{points:internalAsks}}</ul>
  </div>
</body>
</html>`,
  fields: [
    { key: "dealName", name: "Deal name", type: "input", placeholder: "Short internal label" },
    { key: "dealOwner", name: "Deal owner", type: "input", placeholder: "AE or lead" },
    { key: "stageAndValue", name: "Stage & value", type: "input", placeholder: "e.g. Proposal, ~$120k ARR" },
    { key: "accountContext", name: "Account context", type: "textarea", placeholder: "Why now, history, political map." },
    { key: "winStrategy", name: "Strategy to win", type: "textarea", placeholder: "Champion, narrative, proof points." },
    { key: "competition", name: "Competition & landmines", type: "textarea", placeholder: "Alternatives, objections." },
    { key: "risks", name: "Risks & mitigations", type: "textarea", placeholder: "Delivery, legal, technical." },
    { key: "internalAsks", name: "Internal asks", type: "textarea", placeholder: "Pricing, exec, SC, legal review." },
  ],
};

export default internalDealBrief;
