import { Template } from "./index";

const pitchDeck: Template = {
  id: "pitch-deck",
  title: "Pitch Deck Content", 
  description: "The core textual content for a startup pitch deck.",
  created_at: new Date().toISOString(),
  htmlContent: `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8"><title>Pitch Deck: {{text:companyName}}</title>
      <style>
          body { font-family: 'Roboto', sans-serif; line-height: 1.6; color: #fff; background-color: #111827; }
          .slide { min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 40px; border-bottom: 1px solid #374151; }
          h1 { font-size: 3.5em; color: #fff; } h2 { font-size: 2.5em; color: #60a5fa; margin-bottom: 20px; }
          p { max-width: 700px; font-size: 1.2em; color: #d1d5db; }
      </style>
  </head>
  <body>
      <div class="slide"><h1>{{text:companyName}}</h1><p>{{italic:tagline}}</p></div>
      <div class="slide"><h2>The Problem</h2><p>{{text:problem}}</p></div>
      <div class="slide"><h2>Our Solution</h2><p>{{text:solution}}</p></div>
      <div class="slide"><h2>Market Size</h2><p>{{text:marketSize}}</p></div>
      <div class="slide"><h2>Business Model</h2><p>{{text:businessModel}}</p></div>
      <div class="slide"><h2>The Ask</h2><p>{{text:theAsk}}</p></div>
  </body>
  </html>`,
  fields: [
    {
      key: "companyName",
      name: "Company Name",
      type: "input",
      placeholder: "e.g., QuantumLeap",
    },
    {
      key: "tagline",
      name: "Company Tagline",
      type: "input",
      placeholder: "e.g., Reshaping the future of computing.",
    },
    {
      key: "problem",
      name: "The Problem",
      type: "textarea",
      placeholder: "What is the big, urgent problem you are solving?",
    },
    {
      key: "solution",
      name: "Your Solution",
      type: "textarea",
      placeholder:
        "How does your product or service solve this problem in a unique way?",
    },
    {
      key: "marketSize",
      name: "Market Size (TAM, SAM, SOM)",
      type: "textarea",
      placeholder:
        "How big is the opportunity? Describe the total addressable market.",
    },
    {
      key: "businessModel",
      name: "Business Model",
      type: "textarea",
      placeholder:
        "How do you make money? (e.g., SaaS subscription, transaction fees, etc.)",
    },
    {
      key: "theAsk",
      name: "The Ask",
      type: "textarea",
      placeholder: "How much are you raising and what will you use it for?",
    },
  ],
};

export default pitchDeck;
