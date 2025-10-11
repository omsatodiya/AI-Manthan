import { Template } from "./index";

const investmentProposal: Template = {
  id: "investment-proposal",
  title: "Investment Proposal",
  description: "A compelling proposal to attract investors and secure funding.",
  htmlContent: `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8"><title>Investment Proposal: {{text:companyName}}</title>
      <style>
          body { font-family: 'Roboto', sans-serif; line-height: 1.7; color: #333; }
          .container { max-width: 850px; margin: 40px auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
          .header { background-color: #0d47a1; color: white; padding: 40px; text-align: center; border-radius: 8px 8px 0 0; }
          h1 { font-size: 2.8em; margin: 0; } h2 { font-size: 1.8em; color: #0d47a1; border-bottom: 2px solid #1976d2; padding-bottom: 8px; margin-top: 30px; margin-bottom: 20px; }
          .ask { text-align: center; background-color: #e3f2fd; padding: 20px; margin: 20px 0; border: 1px solid #bbdefb; border-radius: 5px; font-size: 1.2em; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; } th, td { border: 1px solid #ddd; padding: 10px; } th { background-color: #1976d2; color: white; }
      </style>
  </head>
  <body>
      <div class="container">
          <div class="header"><h1>{{text:companyName}}</h1><p>{{text:tagline}}</p></div>
          <div class="ask">Seeking {{bold:theAsk}} to Revolutionize the Market</div>
          <h2>1. The Problem</h2><p>{{text:problemStatement}}</p>
          <h2>2. Our Solution</h2>{{paragraphs:solution}}
          <h2>3. Financial Highlights</h2>{{table:financialHighlights}}
          <h2>4. Use of Funds</h2><ul>{{points:useOfFunds}}</ul>
      </div>
  </body>
  </html>`,
  fields: [
    {
      key: "companyName",
      name: "Company Name",
      type: "input",
      placeholder: "e.g., FutureTech AI",
    },
    {
      key: "tagline",
      name: "Company Tagline",
      type: "input",
      placeholder: "e.g., Building Tomorrow's Intelligence",
    },
    {
      key: "theAsk",
      name: "The Ask (Funding Amount)",
      type: "input",
      placeholder: "e.g., $2 Million in Series A Funding",
    },
    {
      key: "problemStatement",
      name: "The Problem",
      type: "textarea",
      placeholder:
        "Describe the critical problem in the market that you are solving.",
    },
    {
      key: "solution",
      name: "Our Solution",
      type: "textarea",
      placeholder:
        "Explain your product or service and how it uniquely solves the problem.",
    },
    {
      key: "financialHighlights",
      name: "Financial Highlights",
      type: "textarea",
      placeholder:
        "Provide key financial metrics. e.g., Metric,Value\nARR,$1.2M\nYoY Growth,150%\nGross Margin,85%",
    },
    {
      key: "useOfFunds",
      name: "Use of Funds",
      type: "textarea",
      placeholder:
        "How will the investment be used? e.g., 40% for Product Development. 30% for Sales & Marketing. 20% for Team Expansion.",
    },
  ],
};

export default investmentProposal;
