import { UserInfo } from "@/lib/types"; // Make sure this path matches your project structure

/**
 * Generates a descriptive, natural-language summary of a user's professional profile.
 * This summary is optimized to be fed into an embedding model (like Gemini's embedding-001)
 * to create a vector representation for similarity matching.
 *
 * @param userInfo - The user's information object from the database.
 * @returns A single string containing the generated profile summary.
 */
export function generateProfileSummary(userInfo: UserInfo): string {
  // An array to hold individual sentences or phrases.
  const summarySentences: string[] = [];

  // --- Core Identity ---
  if (userInfo.role) {
    summarySentences.push(`I am a ${userInfo.role}.`);
  }
  if (userInfo.organizationType) {
    summarySentences.push(`I work within a ${userInfo.organizationType} organization.`);
  }
  if (userInfo.businessStage) {
    summarySentences.push(`My business is currently in the ${userInfo.businessStage} stage.`);
  }
  if (userInfo.teamSize) {
    summarySentences.push(`Our team consists of ${userInfo.teamSize} people.`);
  }

  // --- Industry and Goals (What I do and why) ---
  if (userInfo.industry && userInfo.industry.length > 0) {
    summarySentences.push(`I operate in the following industries: ${userInfo.industry.join(', ')}.`);
  }
  if (userInfo.goals && userInfo.goals.length > 0) {
    summarySentences.push(`My primary professional goals are: ${userInfo.goals.join(', ')}.`);
  }
  if (userInfo.focusAreas && userInfo.focusAreas.length > 0) {
    summarySentences.push(`My key areas of focus include: ${userInfo.focusAreas.join(', ')}.`);
  }

  // --- Collaboration and Opportunities (What I'm looking for) ---
  if (userInfo.opportunityType && userInfo.opportunityType.length > 0) {
    summarySentences.push(`I am actively looking for these types of opportunities: ${userInfo.opportunityType.join(', ')}.`);
  }
  if (userInfo.collabTarget && userInfo.collabTarget.length > 0) {
    summarySentences.push(`I am specifically looking to collaborate with: ${userInfo.collabTarget.join(', ')}.`);
  }
  if (userInfo.collabType && userInfo.collabType.length > 0) {
    summarySentences.push(`I am interested in ${userInfo.collabType.join(' and ')} collaborations.`);
  }
  if (userInfo.partnershipOpen === 'yes') {
    summarySentences.push(`I am open to exploring new partnership opportunities.`);
  }

  // Join all the collected sentences into a single paragraph.
  // If no information is provided, it will return an empty string.
  return summarySentences.join(' ');
}