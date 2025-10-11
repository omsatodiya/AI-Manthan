"use server";

import { getDb } from "@/lib/database";
import { getCurrentUserAction } from "./auth";

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
    const currentUser = await getCurrentUserAction();
    if (!currentUser) {
      return { success: false, message: "User not authenticated" };
    }

    const db = await getDb();

    const existingUserInfo = await db.getUserInfo(currentUser.id, tenantId);

    let result;
    if (existingUserInfo) {
      result = await db.updateUserInfo(currentUser.id, data, tenantId);
    } else {
      result = await db.createUserInfo({
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
      });
    }

    if (result) {
      return {
        success: true,
        message: "User information saved successfully",
        data: result,
      };
    } else {
      return { success: false, message: "Failed to save user information" };
    }
  } catch (error) {
    console.error("Error saving user info:", error);
    return { success: false, message: "Failed to save user information" };
  }
}
