"use server";

import { getDb } from "@/lib/database";
import { getCurrentUserAction } from "./auth";
import { UserInfo } from "@/lib/types/user-info";
import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

type SaveUserInfoData = {
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

  // IMPORTANT
  // embedding must remain number[]
  // NEVER stringify it
  embedding?: number[];
};

// -----------------------------------------
// OpenAI embedding dimension
// -----------------------------------------

const EMBEDDING_DIMENSION = 1536;

// -----------------------------------------
// Helpers
// -----------------------------------------

function removeUndefinedFields<T extends object>(
  obj: T
): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(
      ([, value]) => value !== undefined
    )
  ) as Partial<T>;
}

// -----------------------------------------
// Fallback embedding generation
// -----------------------------------------

function generateFallbackEmbedding(
  text: string
): number[] {
  const embedding = new Array(
    EMBEDDING_DIMENSION
  ).fill(0);

  let hash = 0;

  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);

    hash = ((hash << 5) - hash) + char;

    hash = hash & hash;
  }

  for (
    let i = 0;
    i < EMBEDDING_DIMENSION;
    i++
  ) {
    embedding[i] =
      Math.sin(hash * (i + 1)) * 0.1;
  }

  return embedding;
}

// -----------------------------------------
// Profile summary generator
// -----------------------------------------

function generateProfileSummary(
  userInfo: UserInfo
): string {
  const parts: string[] = [];

  if (userInfo.role) {
    parts.push(`Role: ${userInfo.role}`);
  }

  if (userInfo.organizationType) {
    parts.push(
      `Organization Type: ${userInfo.organizationType}`
    );
  }

  if (userInfo.businessStage) {
    parts.push(
      `Business Stage: ${userInfo.businessStage}`
    );
  }

  if (userInfo.teamSize) {
    parts.push(
      `Team Size: ${userInfo.teamSize}`
    );
  }

  if (userInfo.industry?.length) {
    parts.push(
      `Industry: ${userInfo.industry.join(", ")}`
    );
  }

  if (userInfo.goals?.length) {
    parts.push(
      `Goals: ${userInfo.goals.join(", ")}`
    );
  }

  if (userInfo.opportunityType?.length) {
    parts.push(
      `Opportunity Types: ${userInfo.opportunityType.join(", ")}`
    );
  }

  if (userInfo.focusAreas?.length) {
    parts.push(
      `Focus Areas: ${userInfo.focusAreas.join(", ")}`
    );
  }

  if (userInfo.collabTarget?.length) {
    parts.push(
      `Collaboration Targets: ${userInfo.collabTarget.join(", ")}`
    );
  }

  if (userInfo.collabType?.length) {
    parts.push(
      `Collaboration Types: ${userInfo.collabType.join(", ")}`
    );
  }

  if (userInfo.partnershipOpen) {
    parts.push(
      `Partnership Open: ${userInfo.partnershipOpen}`
    );
  }

  if (userInfo.templateType?.length) {
    parts.push(
      `Template Types: ${userInfo.templateType.join(", ")}`
    );
  }

  if (userInfo.templateTone) {
    parts.push(
      `Template Tone: ${userInfo.templateTone}`
    );
  }

  if (userInfo.templateAutomation) {
    parts.push(
      `Template Automation: ${userInfo.templateAutomation}`
    );
  }

  if (userInfo.eventType?.length) {
    parts.push(
      `Event Types: ${userInfo.eventType.join(", ")}`
    );
  }

  if (userInfo.eventScale) {
    parts.push(
      `Event Scale: ${userInfo.eventScale}`
    );
  }

  if (userInfo.eventFormat?.length) {
    parts.push(
      `Event Format: ${userInfo.eventFormat.join(", ")}`
    );
  }

  return parts.join(". ");
}

// -----------------------------------------
// Retry helper
// -----------------------------------------

async function retry<T>(
  fn: () => Promise<T>,
  retries = 3
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) {
      throw error;
    }

    console.warn(
      `Retrying operation... attempts left: ${retries}`
    );

    return retry(fn, retries - 1);
  }
}

// -----------------------------------------
// Get user info
// -----------------------------------------

export async function getUserInfoAction(
  tenantId?: string
) {
  try {
    const currentUser =
      await getCurrentUserAction();

    if (!currentUser) {
      return {
        success: false,
        message: "User not authenticated",
      };
    }

    const db = await getDb();

    const userInfo = await db.getUserInfo(
      currentUser.id,
      tenantId
    );

    return {
      success: true,
      data: userInfo,
    };
  } catch (error) {
    console.error(
      "🔴 Error fetching user info:",
      error
    );

    return {
      success: false,
      message:
        "Failed to fetch user information",
    };
  }
}

// -----------------------------------------
// Save ONLY form data
// NO embedding generation here
// -----------------------------------------

export async function saveUserInfoAction(
  data: SaveUserInfoData,
  tenantId?: string
) {
  try {
    console.log(
      "🔵 saveUserInfoAction: Starting save operation",
      {
        tenantId,
        dataKeys: Object.keys(data),
      }
    );

    const currentUser =
      await getCurrentUserAction();

    if (!currentUser) {
      return {
        success: false,
        message: "User not authenticated",
      };
    }

    const db = await getDb();

    const cleanData =
      removeUndefinedFields(data);

    const existingUserInfo =
      await db.getUserInfo(
        currentUser.id,
        tenantId
      );

    let result;

    if (existingUserInfo) {
      console.log(
        "🔵 Updating existing user info"
      );

      result = await retry(() =>
        db.updateUserInfo(
          currentUser.id,
          cleanData,
          tenantId
        )
      );
    } else {
      console.log(
        "🔵 Creating new user info"
      );

      result = await retry(() =>
        db.createUserInfo({
          userId: currentUser.id,
          tenantId: tenantId || null,
          ...cleanData,
        })
      );
    }

    if (!result) {
      return {
        success: false,
        message:
          "Failed to save user information",
      };
    }

    console.log(
      "🟢 User information saved successfully"
    );

    return {
      success: true,
      message:
        "User information saved successfully",
      data: result,
    };
  } catch (error) {
    console.error(
      "🔴 saveUserInfoAction error:",
      error
    );

    return {
      success: false,
      message:
        "Failed to save user information",
    };
  }
}

// -----------------------------------------
// Generate embedding ONLY once
// Call after final onboarding step
// -----------------------------------------

export async function generateAndSaveEmbeddingAction(
  tenantId?: string
) {
  try {
    console.log(
      "🔵 generateAndSaveEmbeddingAction started"
    );

    const currentUser =
      await getCurrentUserAction();

    if (!currentUser) {
      return {
        success: false,
        message: "User not authenticated",
      };
    }

    const db = await getDb();

    const userInfo =
      await db.getUserInfo(
        currentUser.id,
        tenantId
      );

    if (!userInfo) {
      return {
        success: false,
        message: "User info not found",
      };
    }

    const profileSummary =
      generateProfileSummary(userInfo);

    console.log(
      "🔵 Generated profile summary:",
      profileSummary
    );

    let embedding: number[];

    // -----------------------------------------
    // OpenAI embedding
    // -----------------------------------------

    if (process.env.OPENAI_API_KEY) {
      try {
        const response = await retry(() =>
          openai.embeddings.create({
            model: "text-embedding-3-small",
            input: profileSummary,
          })
        );

        embedding =
          response.data[0].embedding;

        console.log(
          "🟢 OpenAI embedding generated",
          {
            length: embedding.length,
            preview: embedding.slice(0, 5),
          }
        );
      } catch (error) {
        console.warn(
          "🟡 OpenAI embedding failed, using fallback",
          error
        );

        embedding =
          generateFallbackEmbedding(
            profileSummary
          );
      }
    } else {
      console.warn(
        "🟡 No OpenAI API key found, using fallback embedding"
      );

      embedding =
        generateFallbackEmbedding(
          profileSummary
        );
    }

    // -----------------------------------------
    // Validation
    // -----------------------------------------

    if (!Array.isArray(embedding)) {
      throw new Error(
        "Embedding is not an array"
      );
    }

    if (
      embedding.length !==
      EMBEDDING_DIMENSION
    ) {
      throw new Error(
        `Invalid embedding dimension: ${embedding.length}`
      );
    }

    console.log(
      "🔵 Saving embedding to database",
      {
        embeddingType: typeof embedding,
        isArray: Array.isArray(embedding),
        length: embedding.length,
      }
    );

    // -----------------------------------------
    // IMPORTANT
    // Save RAW number[]
    // DO NOT stringify
    // -----------------------------------------

    const result = await retry(() =>
      db.updateUserInfo(
        currentUser.id,
        {
          embedding,
        },
        tenantId
      )
    );

    if (!result) {
      throw new Error(
        "Failed to save embedding"
      );
    }

    console.log(
      "🟢 Embedding saved successfully"
    );

    return {
      success: true,
      message:
        "Embedding generated successfully",
    };
  } catch (error) {
    console.error(
      "🔴 generateAndSaveEmbeddingAction error:",
      error
    );

    return {
      success: false,
      message:
        "Failed to generate/save embedding",
    };
  }
}