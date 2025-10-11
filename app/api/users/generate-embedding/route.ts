import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/database";
import { getCurrentUserAction } from "@/app/actions/auth";
import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

// Fallback embedding generation using simple hash-based approach
function generateFallbackEmbedding(text: string): number[] {
  const embedding = new Array(1536).fill(0);
  
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  for (let i = 0; i < 1536; i++) {
    embedding[i] = Math.sin(hash * (i + 1)) * 0.1;
  }
  
  return embedding;
}

interface ProfileSummaryData {
  role?: string | null;
  organizationType?: string | null;
  businessStage?: string | null;
  teamSize?: string | null;
  industry?: string[] | null;
  goals?: string[] | null;
  opportunityType?: string[] | null;
  focusAreas?: string[] | null;
  collabTarget?: string[] | null;
  collabType?: string[] | null;
  partnershipOpen?: string | null;
  templateType?: string[] | null;
  templateTone?: string | null;
  templateAutomation?: string | null;
  eventType?: string[] | null;
  eventScale?: string | null;
  eventFormat?: string[] | null;
}

function generateProfileSummary(userInfo: ProfileSummaryData): string {
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

export async function POST(request: NextRequest) {
  try {
    console.log("🔵 /api/users/generate-embedding: Starting embedding generation");

    const currentUser = await getCurrentUserAction();
    if (!currentUser) {
      console.error("🔴 /api/users/generate-embedding: User not authenticated");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId") || undefined;

    console.log("🔵 /api/users/generate-embedding: Fetching user info");
    const currentUserInfo = await db.getUserInfo(currentUser.id, tenantId);

    if (!currentUserInfo) {
      console.error("🔴 /api/users/generate-embedding: No user profile found");
      return NextResponse.json(
        { error: "User profile not found. Please complete your profile first." },
        { status: 404 }
      );
    }

    const profileSummary = generateProfileSummary(currentUserInfo as ProfileSummaryData);
    console.log("🔵 /api/users/generate-embedding: Generated profile summary", profileSummary);
    console.log("🔵 /api/users/generate-embedding: Tenant ID", { tenantId, type: typeof tenantId });

    let embedding: number[];
    let embeddingSource = "fallback";

    if (!process.env.OPENAI_API_KEY) {
      console.warn("🔶 /api/users/generate-embedding: No OpenAI API key found, using fallback");
      embedding = generateFallbackEmbedding(profileSummary);
      embeddingSource = "fallback";
      
      console.log("🔵 /api/users/generate-embedding: Generated fallback embedding", {
        embeddingLength: embedding.length,
        embeddingPreview: embedding.slice(0, 5)
      });
    } else {
      try {
        const embeddingResult = await openai.embeddings.create({
          model: "text-embedding-3-small",
          input: profileSummary,
        });
        
        embedding = embeddingResult.data[0].embedding;
        embeddingSource = "openai";
        
        console.log("🔵 /api/users/generate-embedding: Generated OpenAI embedding", {
          embeddingLength: embedding.length,
          embeddingPreview: embedding.slice(0, 5)
        });
      } catch (openaiError: unknown) {
        console.warn("🔶 /api/users/generate-embedding: OpenAI API error, using fallback", 
          openaiError instanceof Error ? openaiError.message : String(openaiError));
        embedding = generateFallbackEmbedding(profileSummary);
        embeddingSource = "fallback";
        
        console.log("🔵 /api/users/generate-embedding: Generated fallback embedding", {
          embeddingLength: embedding.length,
          embeddingPreview: embedding.slice(0, 5)
        });
      }
    }

    const embeddingResult_db = await db.updateUserInfo(currentUser.id, { 
      embedding: embedding 
    });
    
    if (embeddingResult_db) {
      console.log("🔵 /api/users/generate-embedding: Embedding saved successfully");
      return NextResponse.json({
        success: true,
        message: `Embedding generated successfully using ${embeddingSource} method`,
        embeddingSource,
        embeddingLength: embedding.length
      });
    } else {
      console.error("🔴 /api/users/generate-embedding: Failed to save embedding");
      return NextResponse.json(
        { error: "Failed to save embedding" },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("🔴 /api/users/generate-embedding: Error in embedding generation", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
