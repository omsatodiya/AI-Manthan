import { Template } from "./index";

const jobOffer: Template = {
  id: "job-offer-letter",
  title: "Job Offer Letter",
  description: "A formal letter to offer a position to a candidate.",
  created_at: new Date().toISOString(),
  htmlContent: `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8"><title>Job Offer: {{text:positionTitle}}</title>
      <style>
          body { font-family: 'Segoe UI', sans-serif; line-height: 1.8; color: #333; max-width: 800px; margin: 40px auto; padding: 20px; border: 1px solid #eee; }
          h1 { color: #2c3e50; font-size: 1.8em; margin-bottom: 20px; }
          p { margin-bottom: 1em; }
          strong { color: #34495e; }
          .signature-block { margin-top: 40px; }
      </style>
  </head>
  <body>
      <h1>Job Offer: {{text:positionTitle}}</h1>
      <p><strong>Date:</strong> ${new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })}</p>
      <p><strong>Dear {{text:candidateName}},</strong></p>
      {{paragraphs:offerDetails}}
      <p>The starting salary for this position is {{bold:salary}} per year. You will report to {{text:managerName}}.</p>
      <p>Your anticipated start date is {{text:startDate}}.</p>
      <p>We are excited about the possibility of you joining our team. Please review this offer and return a signed copy by {{text:deadline}}.</p>
      <div class="signature-block">
          <p>Sincerely,</p>
          <p><strong>{{text:hiringManagerName}}</strong><br>
          <em>{{text:hiringManagerTitle}}</em><br>
          <em>{{text:companyName}}</em></p>
      </div>
  </body>
  </html>`,
  fields: [
    {
      key: "companyName",
      name: "Your Company Name",
      type: "input",
      placeholder: "e.g., Tech Innovators LLC",
    },
    {
      key: "candidateName",
      name: "Candidate's Full Name",
      type: "input",
      placeholder: "e.g., Jane Doe",
    },
    {
      key: "positionTitle",
      name: "Position Title",
      type: "input",
      placeholder: "e.g., Senior Software Engineer",
    },
    {
      key: "offerDetails",
      name: "Details about the offer",
      type: "textarea",
      placeholder:
        "Briefly describe why you're excited to offer them the role and what the role entails.",
    },
    {
      key: "salary",
      name: "Salary",
      type: "input",
      placeholder: "e.g., $120,000 USD",
    },
    {
      key: "managerName",
      name: "Direct Manager's Name",
      type: "input",
      placeholder: "e.g., John Smith",
    },
    {
      key: "startDate",
      name: "Anticipated Start Date",
      type: "input",
      placeholder: "e.g., August 1, 2024",
    },
    {
      key: "deadline",
      name: "Offer Deadline",
      type: "input",
      placeholder: "e.g., July 15, 2024",
    },
    {
      key: "hiringManagerName",
      name: "Hiring Manager's Name",
      type: "input",
      placeholder: "e.g., Emily White",
    },
    {
      key: "hiringManagerTitle",
      name: "Hiring Manager's Title",
      type: "input",
      placeholder: "e.g., Director of Engineering",
    },
  ],
};

export default jobOffer;
