"use server";

import { getTemplatesByTenant, getTemplateById } from "@/lib/database/templates";

export async function getTemplatesAction(tenantId?: string) {
  try {
    if (!tenantId) {
      return { success: false, message: "No tenant ID provided" };
    }

    const templates = await getTemplatesByTenant(tenantId);
    return { success: true, data: templates };
  } catch (error) {
    console.error("Error fetching templates:", error);
    return { success: false, message: "Failed to fetch templates" };
  }
}

export async function getTemplateAction(tenantId?: string, templateId?: string) {
  try {
    if (!tenantId || !templateId) {
      return { success: false, message: "Missing tenant ID or template ID" };
    }

    const template = await getTemplateById(tenantId, templateId);
    return { success: true, data: template };
  } catch (error) {
    console.error("Error fetching template:", error);
    return { success: false, message: "Failed to fetch template" };
  }
}
