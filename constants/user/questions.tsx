import { z } from "zod";

export type QuestionType =
  | "role"
  | "organizationType"
  | "businessStage"
  | "teamSize"
  | "industry"
  | "goals"
  | "opportunityType"
  | "focusAreas"
  | "collabTarget"
  | "collabType"
  | "partnershipOpen"
  | "templateType"
  | "templateTone"
  | "templateAutomation"
  | "eventType"
  | "eventScale"
  | "eventFormat";

export interface Question {
  id: QuestionType;
  title: string;
  description: string;
  schema: z.ZodSchema<Record<string, unknown>>;
  options: readonly { value: string; label: string }[];
  type: "radio" | "checkbox";
}

export const roleOptions = [
  { value: "founder", label: "Founder / Business Owner" },
  { value: "manager", label: "Manager / Team Lead" },
  { value: "individual", label: "Individual Contributor" },
  { value: "student", label: "Student / Intern" },
  { value: "consultant", label: "Consultant / Advisor" },
] as const;

export const organizationTypeOptions = [
  { value: "startup", label: "Startup" },
  { value: "msme", label: "MSME / Small Business" },
  { value: "enterprise", label: "Enterprise" },
  { value: "ngo", label: "NGO / Nonprofit" },
  { value: "freelancer", label: "Freelancer / Independent" },
  { value: "community", label: "Community / Association" },
] as const;

export const businessStageOptions = [
  { value: "ideation", label: "Ideation" },
  { value: "early", label: "Early Stage" },
  { value: "growth", label: "Growth Stage" },
  { value: "established", label: "Established" },
  { value: "scaling", label: "Scaling Internationally" },
] as const;

export const teamSizeOptions = [
  { value: "1-5", label: "1–5" },
  { value: "6-20", label: "6–20" },
  { value: "21-50", label: "21–50" },
  { value: "51-200", label: "51–200" },
  { value: "200+", label: "200+" },
] as const;

export const industryOptions = [
  { value: "technology", label: "Technology" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "healthcare", label: "Healthcare" },
  { value: "retail", label: "Retail / E-commerce" },
  { value: "education", label: "Education" },
  { value: "finance", label: "Finance / Fintech" },
  { value: "hospitality", label: "Hospitality" },
  { value: "logistics", label: "Logistics / Supply Chain" },
  { value: "marketing", label: "Marketing / Advertising" },
  { value: "creative", label: "Creative / Design" },
  { value: "other", label: "Other" },
] as const;

export const goalOptions = [
  { value: "networking", label: "Networking" },
  { value: "partnerships", label: "Partnerships" },
  { value: "funding", label: "Funding" },
  { value: "learning", label: "Learning" },
  { value: "hiring", label: "Hiring" },
  { value: "expansion", label: "Business Expansion" },
  { value: "mentorship", label: "Mentorship" },
] as const;

export const opportunityTypeOptions = [
  { value: "collaborations", label: "Collaborations" },
  { value: "events", label: "Events" },
  { value: "funding", label: "Funding" },
  { value: "vendor-deals", label: "Vendor Deals" },
  { value: "job-openings", label: "Job Openings" },
  { value: "knowledge-sharing", label: "Knowledge Sharing" },
] as const;

export const focusAreaOptions = [
  { value: "marketing", label: "Marketing" },
  { value: "operations", label: "Operations" },
  { value: "product", label: "Product Management" },
  { value: "finance", label: "Finance" },
  { value: "technology", label: "Technology / Engineering" },
  { value: "hr", label: "Human Resources" },
  { value: "customer-acquisition", label: "Customer Acquisition" },
] as const;

export const collabTargetOptions = [
  { value: "investors", label: "Investors" },
  { value: "service-providers", label: "Service Providers" },
  { value: "clients", label: "Clients" },
  { value: "talent", label: "Talent / Hiring" },
  { value: "mentors", label: "Mentors" },
  { value: "vendors", label: "Vendors / Suppliers" },
] as const;

export const collabTypeOptions = [
  { value: "joint-projects", label: "Joint Projects" },
  { value: "vendor-partnerships", label: "Vendor Partnerships" },
  { value: "resource-sharing", label: "Resource Sharing" },
  { value: "cross-promotion", label: "Cross Promotion" },
  { value: "mentorship", label: "Mentorship Programs" },
] as const;

export const partnershipOpenOptions = [
  { value: "yes", label: "Yes, open to collaborations" },
  { value: "no", label: "Not currently open" },
] as const;

export const templateTypeOptions = [
  { value: "proposal", label: "Business Proposals" },
  { value: "report", label: "Reports" },
  { value: "marketing-plan", label: "Marketing Plans" },
  { value: "financial-model", label: "Financial Models" },
  { value: "pitch-deck", label: "Pitch Decks" },
  { value: "hr-policies", label: "HR Policies" },
] as const;

export const templateToneOptions = [
  { value: "professional", label: "Professional" },
  { value: "creative", label: "Creative" },
  { value: "analytical", label: "Analytical" },
  { value: "persuasive", label: "Persuasive" },
] as const;

export const templateAutomationOptions = [
  { value: "minimal", label: "Minimal AI Help" },
  { value: "suggestive", label: "Suggestive Fill" },
  { value: "full", label: "Full Auto-Generation" },
] as const;

export const eventTypeOptions = [
  { value: "networking", label: "Networking Meetups" },
  { value: "workshops", label: "Workshops / Seminars" },
  { value: "pitch-events", label: "Pitch Events" },
  { value: "hackathons", label: "Hackathons" },
  { value: "panels", label: "Panel Discussions" },
  { value: "launches", label: "Product Launches" },
] as const;

export const eventScaleOptions = [
  { value: "small", label: "Small (≤20 attendees)" },
  { value: "medium", label: "Medium (20–100 attendees)" },
  { value: "large", label: "Large (100+ attendees)" },
] as const;

export const eventFormatOptions = [
  { value: "offline", label: "Offline" },
  { value: "online", label: "Online" },
  { value: "hybrid", label: "Hybrid" },
] as const;

const createSingleSelectSchema = (
  fieldName: string,
  values: readonly string[]
) =>
  z.object({
    [fieldName]: z.enum([...values] as [string, ...string[]]),
  });

const createMultiSelectSchema = (fieldName: string) =>
  z.object({
    [fieldName]: z
      .array(z.string())
      .min(1, "Please select at least one option."),
  });

export const questions: Question[] = [
  {
    id: "role",
    title: "Your Role",
    description: "What best describes your current role?",
    schema: createSingleSelectSchema(
      "role",
      roleOptions.map((o) => o.value)
    ),
    options: roleOptions,
    type: "radio",
  },
  {
    id: "organizationType",
    title: "Organization Type",
    description: "What type of organization are you part of?",
    schema: createSingleSelectSchema(
      "organizationType",
      organizationTypeOptions.map((o) => o.value)
    ),
    options: organizationTypeOptions,
    type: "radio",
  },
  {
    id: "businessStage",
    title: "Business Stage",
    description: "Which stage is your organization currently in?",
    schema: createSingleSelectSchema(
      "businessStage",
      businessStageOptions.map((o) => o.value)
    ),
    options: businessStageOptions,
    type: "radio",
  },
  {
    id: "teamSize",
    title: "Team Size",
    description: "What is your team size?",
    schema: createSingleSelectSchema(
      "teamSize",
      teamSizeOptions.map((o) => o.value)
    ),
    options: teamSizeOptions,
    type: "radio",
  },
  {
    id: "industry",
    title: "Industry",
    description: "Which industry best represents your work?",
    schema: createMultiSelectSchema("industry"),
    options: industryOptions,
    type: "checkbox",
  },
  {
    id: "goals",
    title: "Community Goals",
    description: "What are your main goals in this community?",
    schema: createMultiSelectSchema("goals"),
    options: goalOptions,
    type: "checkbox",
  },
  {
    id: "opportunityType",
    title: "Opportunity Interests",
    description: "What types of opportunities interest you most?",
    schema: createMultiSelectSchema("opportunityType"),
    options: opportunityTypeOptions,
    type: "checkbox",
  },
  {
    id: "focusAreas",
    title: "Focus Areas",
    description: "What areas are you focusing on right now?",
    schema: createMultiSelectSchema("focusAreas"),
    options: focusAreaOptions,
    type: "checkbox",
  },
  {
    id: "collabTarget",
    title: "Connection Preferences",
    description: "Who would you like to connect with the most?",
    schema: createMultiSelectSchema("collabTarget"),
    options: collabTargetOptions,
    type: "checkbox",
  },
  {
    id: "collabType",
    title: "Collaboration Preferences",
    description: "What kind of collaborations interest you?",
    schema: createMultiSelectSchema("collabType"),
    options: collabTypeOptions,
    type: "checkbox",
  },
  {
    id: "partnershipOpen",
    title: "Partnership Readiness",
    description: "Are you open to partnerships or collaborations right now?",
    schema: createSingleSelectSchema(
      "partnershipOpen",
      partnershipOpenOptions.map((o) => o.value)
    ),
    options: partnershipOpenOptions,
    type: "radio",
  },
  {
    id: "templateType",
    title: "Template Preferences",
    description: "What types of documents do you work with most often?",
    schema: createMultiSelectSchema("templateType"),
    options: templateTypeOptions,
    type: "checkbox",
  },
  {
    id: "templateTone",
    title: "Template Tone",
    description: "What tone do you prefer in generated documents?",
    schema: createSingleSelectSchema(
      "templateTone",
      templateToneOptions.map((o) => o.value)
    ),
    options: templateToneOptions,
    type: "radio",
  },
  {
    id: "templateAutomation",
    title: "AI Assistance Level",
    description: "How much automation do you want in templates?",
    schema: createSingleSelectSchema(
      "templateAutomation",
      templateAutomationOptions.map((o) => o.value)
    ),
    options: templateAutomationOptions,
    type: "radio",
  },
  {
    id: "eventType",
    title: "Event Preferences",
    description: "What types of events interest you most?",
    schema: createMultiSelectSchema("eventType"),
    options: eventTypeOptions,
    type: "checkbox",
  },
  {
    id: "eventScale",
    title: "Preferred Event Scale",
    description: "What size of events do you usually prefer?",
    schema: createSingleSelectSchema(
      "eventScale",
      eventScaleOptions.map((o) => o.value)
    ),
    options: eventScaleOptions,
    type: "radio",
  },
  {
    id: "eventFormat",
    title: "Event Format",
    description: "Which event format do you prefer?",
    schema: createMultiSelectSchema("eventFormat"),
    options: eventFormatOptions,
    type: "checkbox",
  },
];

export const getQuestionById = (id: QuestionType): Question | undefined =>
  questions.find((q) => q.id === id);

export const getQuestionIndex = (id: QuestionType): number =>
  questions.findIndex((q) => q.id === id);

export const getTotalQuestions = (): number => questions.length;
