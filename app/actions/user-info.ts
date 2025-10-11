"use server";

import { getDb } from "@/lib/database";
import { getCurrentUserAction } from "./auth";
import { UserInfo } from "@/lib/types/user-info";
import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

// Fallback embedding generation using simple hash-based approach
function generateFallbackEmbedding(text: string): number[] {
  // Create a simple hash-based embedding of 1536 dimensions (OpenAI text-embedding-3-small)
  const embedding = new Array(1536).fill(0);
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Distribute the hash across the embedding dimensions
  for (let i = 0; i < 1536; i++) {
    embedding[i] = Math.sin(hash * (i + 1)) * 0.1; // Small values to keep embeddings normalized
  }
  
  return embedding;
}

function generateProfileSummary(userInfo: UserInfo): string {
  const parts: string[] = [];
  
  if (userInfo.role) parts.push(`Role: ${userInfo.role}`);
  if (userInfo.organizationType) parts.push(`Organization Type: ${userInfo.organizationType}`);
  if (userInfo.businessStage) parts.push(`Business Stage: ${userInfo.businessStage}`);
  if (userInfo.teamSize) parts.push(`Team Size: ${userInfo.teamSize}`);
  if (userInfo.industry?.length) parts.push(`Industry: ${userInfo.industry.join(", ")}`);
  if (userInfo.goals?.length) parts.push(`Goals: ${userInfo.goals.join(", ")}`);
  if (userInfo.opportunityType?.length) parts.push(`Opportunity Types: ${userInfo.opportunityType.join(", ")}`);
  if (userInfo.focusAreas?.length) parts.push(`Focus Areas: ${userInfo.focusAreas.join(", ")}`);
  if (userInfo.collabTarget?.length) parts.push(`Collaboration Targets: ${userInfo.collabTarget.join(", ")}`);
  if (userInfo.collabType?.length) parts.push(`Collaboration Types: ${userInfo.collabType.join(", ")}`);
  if (userInfo.partnershipOpen) parts.push(`Partnership Open: ${userInfo.partnershipOpen}`);
  if (userInfo.templateType?.length) parts.push(`Template Types: ${userInfo.templateType.join(", ")}`);
  if (userInfo.templateTone) parts.push(`Template Tone: ${userInfo.templateTone}`);
  if (userInfo.templateAutomation) parts.push(`Template Automation: ${userInfo.templateAutomation}`);
  if (userInfo.eventType?.length) parts.push(`Event Types: ${userInfo.eventType.join(", ")}`);
  if (userInfo.eventScale) parts.push(`Event Scale: ${userInfo.eventScale}`);
  if (userInfo.eventFormat?.length) parts.push(`Event Format: ${userInfo.eventFormat.join(", ")}`);
  
  return parts.join(". ");
}

export async function getUserInfoAction(tenantId?: string) {
  try {
    const currentUser = await getCurrentUserAction();
    if (!currentUser) {
      return { success: false, message: "User not authenticated" };
    }

    const db = await getDb();
    const userInfo = await db.getUserInfo(currentUser.id, tenantId);

    return { success: true, data: userInfo };
  } catch (error) {
    console.error("Error fetching user info:", error);
    return { success: false, message: "Failed to fetch user information" };
  }
}

export async function saveUserInfoAction(data: {
  role?: string;
  organizationType?: string;
  businessStage?: string;
  teamSize?: string;
  industry?: string[];
  goals?: string[];
  opportunityType?: string[];
  focusAreas?: string[];
  collabTarget?: string[];
  collabType?: string[];
  partnershipOpen?: string;
  templateType?: string[];
  templateTone?: string;
  templateAutomation?: string;
  eventType?: string[];
  eventScale?: string;
  eventFormat?: string[];
}, tenantId?: string) {
  try {
    console.log("🔵 saveUserInfoAction: Starting save operation", {
      data,
      tenantId,
      dataKeys: Object.keys(data)
    });

    const currentUser = await getCurrentUserAction();
    if (!currentUser) {
      console.error("🔴 saveUserInfoAction: User not authenticated");
      return { success: false, message: "User not authenticated" };
    }

    console.log("🔵 saveUserInfoAction: User authenticated", {
      userId: currentUser.id,
      userEmail: currentUser.email
    });

    const db = await getDb();

    console.log("🔵 saveUserInfoAction: Checking for existing user info");
    const existingUserInfo = await db.getUserInfo(currentUser.id, tenantId);
    console.log("🔵 saveUserInfoAction: Existing user info", {
      exists: !!existingUserInfo,
      existingData: existingUserInfo
    });

    let result;
    if (existingUserInfo) {
      console.log("🔵 saveUserInfoAction: Updating existing user info");
      result = await db.updateUserInfo(currentUser.id, data, tenantId);
      console.log("🔵 saveUserInfoAction: Update result", { result });
    } else {
      console.log("🔵 saveUserInfoAction: Creating new user info");
      const createData = {
        userId: currentUser.id,
        tenantId: tenantId || null,
        role: data.role,
        organizationType: data.organizationType,
        businessStage: data.businessStage,
        teamSize: data.teamSize,
        industry: data.industry,
        goals: data.goals,
        opportunityType: data.opportunityType,
        focusAreas: data.focusAreas,
        collabTarget: data.collabTarget,
        collabType: data.collabType,
        partnershipOpen: data.partnershipOpen,
        templateType: data.templateType,
        templateTone: data.templateTone,
        templateAutomation: data.templateAutomation,
        eventType: data.eventType,
        eventScale: data.eventScale,
        eventFormat: data.eventFormat,
      };
      console.log("🔵 saveUserInfoAction: Create data", createData);
      result = await db.createUserInfo(createData);
      console.log("🔵 saveUserInfoAction: Create result", { result });
    }

    if (result) {
      console.log("🔵 saveUserInfoAction: Save successful, generating embedding");
      
      try {
        const profileSummary = generateProfileSummary(result);
        console.log("🔵 saveUserInfoAction: Generated profile summary", profileSummary);

        // Try to generate embedding with OpenAI API
        if (!process.env.OPENAI_API_KEY) {
          console.warn("🔶 saveUserInfoAction: No OpenAI API key found, using fallback");
          const fallbackEmbedding = generateFallbackEmbedding(profileSummary);
          
          const embeddingResult_db = await db.updateUserInfo(currentUser.id, { 
            embedding: fallbackEmbedding 
          }, tenantId);
          
          if (embeddingResult_db) {
            console.log("🔵 saveUserInfoAction: Fallback embedding saved successfully");
          } else {
            console.error("🔴 saveUserInfoAction: Failed to save fallback embedding");
          }
        } else {
          try {
            const embeddingResult = await openai.embeddings.create({
              model: "text-embedding-3-small",
              input: profileSummary,
            });
            
            const embedding = embeddingResult.data[0].embedding;
            
            console.log("🔵 saveUserInfoAction: Generated OpenAI embedding", {
              embeddingLength: embedding.length,
              embeddingPreview: embedding.slice(0, 5)
            });

            const embeddingResult_db = await db.updateUserInfo(currentUser.id, { 
              embedding: embedding 
            }, tenantId);
            
            if (embeddingResult_db) {
              console.log("🔵 saveUserInfoAction: Embedding saved successfully");
            } else {
              console.error("🔴 saveUserInfoAction: Failed to save embedding");
            }
          } catch (openaiError: unknown) {
            console.warn("🔶 saveUserInfoAction: OpenAI API error, using fallback", 
              openaiError instanceof Error ? openaiError.message : String(openaiError));
            
            // Fallback: Generate a simple hash-based embedding
            const fallbackEmbedding = generateFallbackEmbedding(profileSummary);
            
            const embeddingResult_db = await db.updateUserInfo(currentUser.id, { 
              embedding: fallbackEmbedding 
            }, tenantId);
            
            if (embeddingResult_db) {
              console.log("🔵 saveUserInfoAction: Fallback embedding saved successfully");
            } else {
              console.error("🔴 saveUserInfoAction: Failed to save fallback embedding");
            }
          }
        }
      } catch (embeddingError) {
        console.error("🔴 saveUserInfoAction: Error generating/saving embedding", embeddingError);
      }

      return {
        success: true,
        message: "User information saved successfully",
        data: result,
      };
    } else {
      console.error("🔴 saveUserInfoAction: Save failed - no result returned");
      return { success: false, message: "Failed to save user information" };
    }
  } catch (error) {
    console.error("🔴 saveUserInfoAction: Exception during save", error);
    return { success: false, message: "Failed to save user information" };
  }
}
