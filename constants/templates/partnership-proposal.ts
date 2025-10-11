import { Template } from "./index";

const partnershipProposal: Template = {
  id: "partnership-proposal",
  title: "Partnership Proposal",
  description: "A proposal to form a strategic alliance with another business.",
  created_at: new Date().toISOString(),
  htmlContent: `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8"><title>Partnership Proposal: {{text:companyName}} + {{text:partnerName}}</title>
      <style>
          body { font-family: 'Segoe UI', sans-serif; line-height: 1.7; color: #444; }
          .container { max-width: 850px; margin: 40px auto; background: white; padding: 40px; border-top: 8px solid #00796b; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
          h1 { font-size: 2.5em; color: #004d40; text-align: center; margin-bottom: 30px; }
          h2 { font-size: 1.7em; color: #00796b; border-bottom: 2px solid #b2dfdb; padding-bottom: 8px; margin-top: 30px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; } th, td { border: 1px solid #ddd; padding: 10px; } th { background-color: #e0f2f1; }
      </style>
  </head>
  <body>
      <div class="container">
          <h1>Strategic Partnership Proposal</h1>
          <h2>1. Introduction</h2><p>{{text:proposalOverview}}</p>
          <h2>2. Mutual Benefits</h2><ul>{{points:mutualBenefits}}</ul>
          <h2>3. Proposed Collaboration Structure</h2>{{paragraphs:collaborationStructure}}
          <h2>4. Proposed Timeline</h2>{{table:proposedTimeline}}
      </div>
  </body>
  </html>`,
  fields: [
    {
      key: "companyName",
      name: "Your Company Name",
      type: "input",
      placeholder: "e.g., Synergy Software",
    },
    {
      key: "partnerName",
      name: "Potential Partner's Name",
      type: "input",
      placeholder: "e.g., Connective Data Inc.",
    },
    {
      key: "proposalOverview",
      name: "Proposal Overview",
      type: "textarea",
      placeholder:
        "Briefly introduce your company and explain why a partnership would be valuable.",
    },
    {
      key: "mutualBenefits",
      name: "Mutual Benefits",
      type: "textarea",
      placeholder:
        "List the key benefits for both companies. e.g., Access to new markets. Combined technology offerings. Increased brand reach.",
    },
    {
      key: "collaborationStructure",
      name: "Collaboration Structure",
      type: "textarea",
      placeholder:
        "How will the partnership work? Describe the proposed model, such as co-marketing, technology integration, or joint ventures.",
    },
    {
      key: "proposedTimeline",
      name: "Proposed Timeline",
      type: "textarea",
      placeholder:
        "Outline the key phases for launching the partnership. e.g., Phase,Goal,Timeline\n1. Initial Discussion,Align on goals,2 Weeks\n2. Agreement,Finalize terms,4 Weeks\n3. Launch,Go-to-market,8 Weeks",
    },
  ],
};

export default partnershipProposal;
