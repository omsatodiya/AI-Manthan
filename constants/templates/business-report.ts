import { Template } from "./index";

const businessReport: Template = {
  id: "business-report",
  title: "Business Report",
  description: "A comprehensive report for market and performance analysis.",
  htmlContent: `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8"><title>Business Report: {{text:companyName}}</title>
      <style>
          body { font-family: 'Times New Roman', serif; line-height: 1.6; color: #333; }
          .container { max-width: 850px; margin: 40px auto; background: white; padding: 40px; border: 1px solid #ccc; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
          h1 { font-size: 2.5em; } h2 { font-size: 1.8em; color: #333; border-bottom: 1px solid #888; padding-bottom: 5px; margin-top: 30px; margin-bottom: 15px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; } th, td { border: 1px solid #ccc; padding: 10px; } th { background-color: #f2f2f2; }
      </style>
  </head>
  <body>
      <div class="container">
          <div class="header">
              <h1>Business Performance Report</h1>
              <p><strong>Company:</strong> {{text:companyName}}</p>
              <p><strong>Period:</strong> {{text:reportPeriod}}</p>
          </div>
          <h2>1. Executive Summary</h2><p>{{text:executiveSummary}}</p>
          <h2>2. Performance Metrics</h2>{{table:performanceMetrics}}
          <h2>3. Key Findings</h2><ul>{{points:keyFindings}}</ul>
          <h2>4. Strategic Recommendations</h2>{{paragraphs:recommendations}}
      </div>
  </body>
  </html>`,
  fields: [
    {
      key: "companyName",
      name: "Company Name",
      type: "input",
      placeholder: "e.g., Data Insights Corp",
    },
    {
      key: "reportPeriod",
      name: "Report Period",
      type: "input",
      placeholder: "e.g., Q3 2024 (July 1 - September 30)",
    },
    {
      key: "executiveSummary",
      name: "Executive Summary",
      type: "textarea",
      placeholder:
        "Briefly summarize the key highlights, challenges, and outcomes of the period.",
    },
    {
      key: "performanceMetrics",
      name: "Performance Metrics",
      type: "textarea",
      placeholder:
        "Provide key data points. e.g., Metric,Value,Change\nRevenue,$5.2M,+15%\nNew Customers,1,200,+8%\nChurn Rate,2.1%,-0.5%",
    },
    {
      key: "keyFindings",
      name: "Key Findings",
      type: "textarea",
      placeholder:
        "What are the most important insights from the data? e.g., Strong growth in enterprise segment. Social media marketing shows high ROI.",
    },
    {
      key: "recommendations",
      name: "Strategic Recommendations",
      type: "textarea",
      placeholder:
        "Based on the findings, what actions should be taken next? e.g., Increase budget for social media. Develop new features for enterprise clients.",
    },
  ],
};

export default businessReport;
