import { z } from "zod";

export type QuestionType =
  | "applicantRole"
  | "organizationCategory"
  | "focusArea"
  | "applicationGoal"
  | "teamStrength"
  | "experienceLevel"
  | "portfolioLink"
  | "expectedOutcome";

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

// ----- OPTIONS -----
export const applicantRoleOptions = [
  { value: "founder", label: "Founder / Owner" },
  { value: "manager", label: "Manager / Lead" },
  { value: "student", label: "Student / Intern" },
  { value: "volunteer", label: "Volunteer" },
  { value: "member", label: "Member / Contributor" },
] as const;

export const organizationCategoryOptions = [
  { value: "startup", label: "Startup" },
  { value: "ngo", label: "NGO / Nonprofit" },
  { value: "community", label: "Community Group" },
  { value: "college", label: "College / Institute Club" },
  { value: "business", label: "Business / Company" },
] as const;

export const focusAreaOptions = [
  { value: "education", label: "Education" },
  { value: "technology", label: "Technology" },
  { value: "environment", label: "Environment" },
  { value: "health", label: "Health & Wellness" },
  { value: "social-impact", label: "Social Impact" },
] as const;

export const applicationGoalOptions = [
  { value: "collaboration", label: "Collaboration" },
  { value: "funding", label: "Funding Support" },
  { value: "volunteering", label: "Volunteering" },
  { value: "awareness", label: "Awareness or Outreach" },
  { value: "growth", label: "Business / Project Growth" },
] as const;

export const teamStrengthOptions = [
  { value: "1-5", label: "1–5 Members" },
  { value: "6-20", label: "6–20 Members" },
  { value: "21-50", label: "21–50 Members" },
  { value: "50+", label: "50+ Members" },
] as const;

export const experienceLevelOptions = [
  { value: "beginner", label: "Beginner (No Prior Experience)" },
  { value: "intermediate", label: "Intermediate (Some Experience)" },
  { value: "advanced", label: "Advanced (Extensive Experience)" },
] as const;

// ----- QUESTIONS -----
export const announcementQuestions = [
  {
    id: "applicantRole",
    title: "Your Role",
    description: "What best describes your current role?",
    schema: createSingleSelectSchema(
      "applicantRole",
      applicantRoleOptions.map((o) => o.value)
    ),
    options: applicantRoleOptions,
    type: "radio",
  },
  {
    id: "organizationCategory",
    title: "Organization Type",
    description: "What type of organization are you representing?",
    schema: createSingleSelectSchema(
      "organizationCategory",
      organizationCategoryOptions.map((o) => o.value)
    ),
    options: organizationCategoryOptions,
    type: "radio",
  },
  {
    id: "focusArea",
    title: "Focus Area",
    description: "Which area best represents your current work?",
    schema: createMultiSelectSchema("focusArea"),
    options: focusAreaOptions,
    type: "checkbox",
  },
  {
    id: "applicationGoal",
    title: "Goal of Application",
    description: "What is your main goal for applying?",
    schema: createMultiSelectSchema("applicationGoal"),
    options: applicationGoalOptions,
    type: "checkbox",
  },
  {
    id: "teamStrength",
    title: "Team Size",
    description: "How many people are active in your organization?",
    schema: createSingleSelectSchema(
      "teamStrength",
      teamStrengthOptions.map((o) => o.value)
    ),
    options: teamStrengthOptions,
    type: "radio",
  },
  {
    id: "experienceLevel",
    title: "Experience Level",
    description: "How experienced is your team in this field?",
    schema: createSingleSelectSchema(
      "experienceLevel",
      experienceLevelOptions.map((o) => o.value)
    ),
    options: experienceLevelOptions,
    type: "radio",
  },
  {
    id: "portfolioLink",
    title: "Portfolio / Work Link",
    description: "Provide a link to any document or project showcasing your work.",
    schema: z.object({
      portfolioLink: z
        .string()
        .url("Please enter a valid URL.")
        .optional(),
    }),
    options: [],
    type: "radio",
  },
  {
    id: "expectedOutcome",
    title: "Expected Outcome",
    description: "What do you hope to achieve through this announcement?",
    schema: z.object({
      expectedOutcome: z
        .string()
        .min(5, "Please describe your expected outcome."),
    }),
    options: [],
    type: "radio",
  },
];
