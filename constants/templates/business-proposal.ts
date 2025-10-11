import { Template } from "./index";

const businessProposal: Template = {
  id: "business-proposal",
  title: "Business Proposal",
  description:
    "A professional proposal to outline your services and solutions.",
  created_at: new Date().toISOString(),
  htmlContent: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8"><title>Business Proposal for {{text:clientName}}</title>
    <style>
        @import url('https:
        body { font-family: 'Roboto', sans-serif; line-height: 1.6; color: #333; background-color: #f4f7f9; }
        .page { page-break-after: always; } .page:last-child { page-break-after: avoid; }
        .cover-page { min-height: 100vh; background: linear-gradient(135deg, #4a69bd 0%, #1e3c72 100%); color: white; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 40px; }
        .cover-page h1 { font-size: 3.5em; font-weight: 700; margin-bottom: 20px; } .cover-page h2 { font-size: 1.8em; font-weight: 300; margin-bottom: 40px; }
        .container { max-width: 850px; margin: 40px auto; background: white; box-shadow: 0 4px 20px rgba(0,0,0,0.08); padding: 50px 60px; }
        h2.section-title { font-size: 2em; font-weight: 700; color: #1e3c72; margin-bottom: 25px; padding-bottom: 10px; border-bottom: 3px solid #4a69bd; }
        p, li { font-size: 1.05em; color: #555; margin-bottom: 15px; } ul { list-style-position: inside; padding-left: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 1em; }
        th, td { border: 1px solid #e0e0e0; padding: 12px 15px; text-align: left; } th { background-color: #4a69bd; color: white; font-weight: 500; }
    </style>
</head>
<body>
    <div class="page cover-page">
        <h1>{{text:projectName}}</h1>
        <h2>Business Proposal</h2>
        <p><strong>Prepared For:</strong> {{text:clientName}}</p>
        <p><strong>Prepared By:</strong> {{text:companyName}}</p>
    </div>
    <div class="page container">
        <h2 class="section-title">1. Executive Summary</h2>{{paragraphs:executiveSummary}}
        <h2 class="section-title">2. Understanding Your Needs</h2>{{paragraphs:clientChallenge}}
        <h2 class="section-title">3. Proposed Solution</h2>{{paragraphs:proposedSolution}}
    </div>
    <div class="page container">
        <h2 class="section-title">4. Scope of Work</h2><ul>{{points:scopeOfWork}}</ul>
        <h2 class="section-title">5. Project Timeline</h2>{{table:timeline}}
    </div>
    <div class="page container">
        <h2 class="section-title">6. Investment</h2>{{table:pricing}}
        <h2 class="section-title">7. About Us</h2><p>{{text:aboutUs}}</p>
        <h2 class="section-title">8. Next Steps</h2><p>{{text:nextSteps}}</p>
    </div>
</body>
</html>`,
  fields: [
    {
      key: "companyName",
      name: "Your Company Name",
      type: "input",
      placeholder: "e.g., Innovate Solutions Inc.",
    },
    {
      key: "clientName",
      name: "Client's Company Name",
      type: "input",
      placeholder: "e.g., Global Tech Corp",
    },
    {
      key: "projectName",
      name: "Project Name / Proposal Title",
      type: "input",
      placeholder: "e.g., Digital Transformation Strategy",
    },
    {
      key: "executiveSummary",
      name: "Brief Summary of the Proposal",
      type: "textarea",
      placeholder:
        "Provide a high-level overview of the client's problem, your proposed solution, and the expected outcome.",
    },
    {
      key: "clientChallenge",
      name: "Client's Main Challenge",
      type: "textarea",
      placeholder:
        "Describe the client's primary pain points, goals, and what they are struggling to achieve.",
    },
    {
      key: "proposedSolution",
      name: "Your Proposed Solution",
      type: "textarea",
      placeholder:
        "Briefly describe your core solution. How does it solve the client's challenge? What makes it unique?",
    },
    {
      key: "scopeOfWork",
      name: "Scope of Work",
      type: "textarea",
      placeholder:
        "List the specific deliverables and tasks you will perform. e.g., A full website audit, development of a new e-commerce platform, and staff training sessions.",
    },
    {
      key: "timeline",
      name: "Project Timeline",
      type: "textarea",
      placeholder:
        "Describe the project phases. e.g., First we'll do discovery for a couple of weeks, then design, then a long development phase, and finally launch.",
    },
    {
      key: "pricing",
      name: "Pricing Breakdown",
      type: "textarea",
      placeholder:
        "What are the cost components? e.g., The main cost is the website development. We also need to budget for content creation and monthly maintenance.",
    },
    {
      key: "aboutUs",
      name: "About Your Company",
      type: "textarea",
      placeholder:
        "Briefly describe your company's mission, expertise, and relevant experience.",
    },
    {
      key: "nextSteps",
      name: "Next Steps",
      type: "textarea",
      placeholder:
        "Tell the client what to do next. e.g., 'To proceed, please sign and return this proposal by [Date].'",
    },
  ],
};

export default businessProposal;
