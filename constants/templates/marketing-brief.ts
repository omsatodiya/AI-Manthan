import { Template } from "./index";

const marketingBrief: Template = {
  id: "marketing-brief",
  title: "Marketing Campaign Brief",
  description: "A strategic brief to outline a new marketing campaign.",
  htmlContent: `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8"><title>Marketing Brief: {{text:campaignName}}</title>
      <style>
          body { font-family: 'Roboto', sans-serif; line-height: 1.7; color: #333; background-color: #f9f9f9; }
          .container { max-width: 850px; margin: 40px auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
          h1 { font-size: 2.2em; color: #1a237e; margin-bottom: 10px; }
          h2 { font-size: 1.6em; color: #1a237e; border-bottom: 2px solid #3f51b5; padding-bottom: 8px; margin-top: 30px; margin-bottom: 20px; }
          h3 { font-size: 1.2em; font-weight: 700; color: #3f51b5; margin-top: 20px; margin-bottom: 10px; }
          p, li { font-size: 1em; } ul { list-style-position: inside; padding-left: 5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; } th, td { border: 1px solid #ddd; padding: 10px; } th { background-color: #3f51b5; color: white; }
      </style>
  </head>
  <body>
      <div class="container">
          <h1>Marketing Campaign Brief</h1>
          <p><strong>Campaign Name:</strong> {{text:campaignName}}</p>
          <h2>1. Campaign Overview</h2><p>{{text:overview}}</p>
          <h2>2. Objectives & KPIs</h2>{{heading:objectivesTitle}}<ul>{{points:objectivesList}}</ul>
          <h2>3. Target Audience</h2><p>{{text:audience}}</p>
          <h2>4. Key Message</h2><p>{{italic:keyMessage}}</p>
          <h2>5. Deliverables & Timeline</h2>{{table:deliverables}}
      </div>
  </body>
  </html>`,
  fields: [
    {
      key: "campaignName",
      name: "Campaign Name",
      type: "input",
      placeholder: "e.g., Q4 Product Launch",
    },
    {
      key: "overview",
      name: "Campaign Overview",
      type: "textarea",
      placeholder:
        "What is this campaign about? What product or service is it promoting?",
    },
    {
      key: "objectivesTitle",
      name: "Main Objective Title",
      type: "input",
      placeholder: "e.g., Primary Goals for This Campaign",
    },
    {
      key: "objectivesList",
      name: "List of Objectives",
      type: "textarea",
      placeholder:
        "What are the measurable goals? e.g., Generate 500 new leads. Increase website traffic by 20%. Boost social media engagement.",
    },
    {
      key: "audience",
      name: "Target Audience",
      type: "textarea",
      placeholder:
        "Describe the ideal customer for this campaign. Include demographics and interests.",
    },
    {
      key: "keyMessage",
      name: "Key Message",
      type: "textarea",
      placeholder:
        "What is the single most important message we want the audience to remember?",
    },
    {
      key: "deliverables",
      name: "Deliverables and Timeline",
      type: "textarea",
      placeholder:
        "What needs to be created and when? e.g., Item,Due Date\nEmail Blast,Oct 15\nSocial Media Ads,Oct 20\nBlog Post,Oct 25",
    },
  ],
};

export default marketingBrief;
