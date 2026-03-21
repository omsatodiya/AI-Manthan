"use server";

import {
  getTemplatesByTenant,
  getAllTemplates,
  getTemplateById,
} from "@/lib/database/templates";
import type { TemplateCategoryId } from "@/constants/templates";

export async function getTemplatesAction(tenantId?: string) {
  try {
    const { getCurrentUserAction } = await import("./auth");
    const currentUser = await getCurrentUserAction();
    const resolvedTenantId = tenantId ?? currentUser?.tenantId ?? undefined;

    if (currentUser?.role === "admin") {
      const templates = await getAllTemplates();
      return { success: true, data: templates };
    }

    if (!resolvedTenantId) {
      return { success: false, message: "No tenant ID provided" };
    }

    const templates = await getTemplatesByTenant(resolvedTenantId);
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

export async function createTemplateAction(templateData: {
  title: string;
  description: string;
  htmlContent: string;
  category?: TemplateCategoryId;
  fields: Array<{
    key: string;
    name: string;
    type: "input" | "textarea";
    placeholder: string;
  }>;
}) {
  try {
    // Get current user to determine tenant
    const { getCurrentUserAction } = await import("./auth");
    const currentUser = await getCurrentUserAction();
    
    if (!currentUser?.tenantId) {
      return { success: false, message: "No tenant found for user" };
    }

    const { createTemplate } = await import("@/lib/database/templates");
    const template = await createTemplate(currentUser.tenantId, {
      title: templateData.title,
      description: templateData.description,
      htmlContent: templateData.htmlContent,
      fields: templateData.fields,
      category: templateData.category ?? "general",
      created_at: new Date().toISOString(),
    });

    return { success: true, data: template };
  } catch (error) {
    console.error("Error creating template:", error);
    return { success: false, message: "Failed to create template" };
  }
}

export async function updateTemplateAction(templateId: string, updates: {
  title?: string;
  description?: string;
  htmlContent?: string;
  category?: TemplateCategoryId;
  fields?: Array<{
    key: string;
    name: string;
    type: "input" | "textarea";
    placeholder: string;
  }>;
}) {
  try {
    const { getCurrentUserAction } = await import("./auth");
    const currentUser = await getCurrentUserAction();
    
    if (!currentUser?.tenantId) {
      return { success: false, message: "No tenant found for user" };
    }

    const { updateTemplate } = await import("@/lib/database/templates");
    const template = await updateTemplate(currentUser.tenantId, templateId, updates);

    return { success: true, data: template };
  } catch (error) {
    console.error("Error updating template:", error);
    return { success: false, message: "Failed to update template" };
  }
}

export async function deleteTemplateAction(templateId: string) {
  try {
    // Get current user to determine tenant
    const { getCurrentUserAction } = await import("./auth");
    const currentUser = await getCurrentUserAction();
    
    if (!currentUser?.tenantId) {
      return { success: false, message: "No tenant found for user" };
    }

    const { deleteTemplate } = await import("@/lib/database/templates");
    await deleteTemplate(currentUser.tenantId, templateId);

    return { success: true };
  } catch (error) {
    console.error("Error deleting template:", error);
    return { success: false, message: "Failed to delete template" };
  }
}
