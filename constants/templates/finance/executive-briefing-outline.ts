import { Template } from "../index";

const executiveBriefingOutline: Template = {
  id: "executive-briefing-outline-blueprint",
  title: "Executive narrative",
  description:
    "Short leadership narrative: context, options, trade-offs, and a clear point of view.",
  created_at: new Date().toISOString(),
  category: "finance-leadership",
  audience: "either",
  htmlContent: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><title>Executive briefing - {{text:topic}}</title>
  <style>
    body { font-family: Georgia, serif; line-height: 1.7; color: #111827; max-width: 760px; margin: 0 auto; padding: 40px; }
    h1 { font-size: 1.6rem; margin-bottom: 0.25rem; }
    .meta { color: #6b7280; font-size: 0.95rem; margin-bottom: 1.5rem; }
    h2 { font-size: 1.1rem; margin-top: 1.75rem; color: #1f2937; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
    ul { padding-left: 1.25rem; }
  </style>
</head>
<body>
  <h1>Executive briefing</h1>
  <p class="meta">{{text:topic}} · {{text:briefingDate}} · Audience: {{text:audience}}</p>
  <h2>Context</h2>
  <p>{{text:context}}</p>
  <h2>What we know</h2>
  <ul>{{points:factsBullets}}</ul>
  <h2>Options</h2>
  <p>{{text:options}}</p>
  <h2>Trade-offs</h2>
  <p>{{text:tradeoffs}}</p>
  <h2>Recommendation</h2>
  <p>{{text:recommendation}}</p>
  <h2>What we need</h2>
  {{paragraphs:asks}}</body>
</html>`,
  fields: [
    { key: "topic", name: "Topic", type: "input", placeholder: "e.g. Pricing strategy" },
    { key: "briefingDate", name: "Date", type: "input", placeholder: "e.g. 22 Mar 2025" },
    { key: "audience", name: "Audience", type: "input", placeholder: "e.g. ELT, Board committee" },
    { key: "context", name: "Context", type: "textarea", placeholder: "Why this matters now." },
    { key: "factsBullets", name: "Facts (bullets)", type: "textarea", placeholder: "One fact per line." },
    { key: "options", name: "Options", type: "textarea", placeholder: "Realistic paths forward." },
    { key: "tradeoffs", name: "Trade-offs", type: "textarea", placeholder: "Costs, risks, timing." },
    { key: "recommendation", name: "Recommendation", type: "textarea", placeholder: "Clear point of view." },
    { key: "asks", name: "What we need", type: "textarea", placeholder: "Decisions, resources, or alignment." },
  ],
};

export default executiveBriefingOutline;
