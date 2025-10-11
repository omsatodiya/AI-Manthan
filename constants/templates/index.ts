import businessProposal from "./business-proposal";
import jobOffer from "./job-offer";
import marketingBrief from "./marketing-brief";
import businessReport from "./business-report";
import investmentProposal from "./investment-proposal";
import partnershipProposal from "./partnership-proposal";
import pitchDeck from "./pitch-deck";

export interface TemplateField {
  key: string;
  name: string;
  type: "input" | "textarea";
  placeholder: string;
}

export interface Template {
  id: string;
  title: string;
  description: string;
  htmlContent: string;
  fields: TemplateField[];
}

export const templates: Template[] = [
  businessProposal,
  jobOffer,
  marketingBrief,
  businessReport,
  investmentProposal,
  partnershipProposal,
  pitchDeck,
];
