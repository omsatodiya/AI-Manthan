import { createClient } from "@supabase/supabase-js";
import { Template, TemplateField } from "@/constants/templates";

function getTemplatesSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) throw new Error("Supabase URL is missing");
  const key = serviceKey || anonKey;
  if (!key) throw new Error("Supabase key is missing");

  return createClient(supabaseUrl, key);
}

export interface DatabaseTemplate {
  id: string;
  tenant_id: string;
  title: string;
  description: string;
  html_content: string;
  fields: TemplateField[];
  created_at: string;
  updated_at: string;
}

export async function getTemplatesByTenant(
  tenantId: string
): Promise<Template[]> {
  try {
    if (!tenantId || tenantId.trim() === "") {
      console.warn("Empty tenant ID provided");
      return [];
    }

    const supabase = getTemplatesSupabase();
    const { data, error } = await supabase
      .from("templates")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching templates:", error);
      throw new Error(`Failed to fetch templates: ${error.message}`);
    }

    return (data || []).map(convertDatabaseTemplateToTemplate);
  } catch (err) {
    console.error("Error in getTemplatesByTenant:", err);
    throw err;
  }
}

export async function getAllTemplates(): Promise<Template[]> {
  try {
    const supabase = getTemplatesSupabase();
    const { data, error } = await supabase
      .from("templates")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching all templates:", error);
      throw new Error(`Failed to fetch templates: ${error.message}`);
    }

    return (data || []).map(convertDatabaseTemplateToTemplate);
  } catch (err) {
    console.error("Error in getAllTemplates:", err);
    throw err;
  }
}

export async function getTemplateById(
  tenantId: string,
  templateId: string
): Promise<Template | null> {
  if (!tenantId || tenantId.trim() === "") {
    console.warn("Empty tenant ID provided");
    return null;
  }

  const supabase = getTemplatesSupabase();
  const { data, error } = await supabase
    .from("templates")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", templateId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    console.error("Error fetching template:", error);
    throw new Error("Failed to fetch template");
  }

  return convertDatabaseTemplateToTemplate(data);
}

export async function createTemplate(
  tenantId: string,
  template: Omit<Template, "id">
): Promise<Template> {
  if (!tenantId || tenantId.trim() === "") {
    throw new Error("Empty tenant ID provided");
  }

  const supabase = getTemplatesSupabase();
  const { data, error } = await supabase
    .from("templates")
    .insert({
      tenant_id: tenantId,
      title: template.title,
      description: template.description,
      html_content: template.htmlContent,
      fields: template.fields,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating template:", error);
    throw new Error("Failed to create template");
  }

  return convertDatabaseTemplateToTemplate(data);
}

export async function updateTemplate(
  tenantId: string,
  templateId: string,
  updates: Partial<Template>
): Promise<Template> {
  if (!tenantId || tenantId.trim() === "") {
    throw new Error("Empty tenant ID provided");
  }

  const updateData: Record<string, unknown> = {};
  if (updates.title) updateData.title = updates.title;
  if (updates.description) updateData.description = updates.description;
  if (updates.htmlContent) updateData.html_content = updates.htmlContent;
  if (updates.fields) updateData.fields = updates.fields;

  const supabase = getTemplatesSupabase();
  const { data, error } = await supabase
    .from("templates")
    .update(updateData)
    .eq("tenant_id", tenantId)
    .eq("id", templateId)
    .select()
    .single();

  if (error) {
    console.error("Error updating template:", error);
    throw new Error("Failed to update template");
  }

  return convertDatabaseTemplateToTemplate(data);
}

export async function deleteTemplate(
  tenantId: string,
  templateId: string
): Promise<void> {
  if (!tenantId || tenantId.trim() === "") {
    throw new Error("Empty tenant ID provided");
  }

  const supabase = getTemplatesSupabase();
  const { error } = await supabase
    .from("templates")
    .delete()
    .eq("tenant_id", tenantId)
    .eq("id", templateId);

  if (error) {
    console.error("Error deleting template:", error);
    throw new Error("Failed to delete template");
  }
}

function convertDatabaseTemplateToTemplate(
  dbTemplate: Record<string, unknown>
): Template {
  const htmlContent =
    (dbTemplate.html_content as string) ?? (dbTemplate.htmlContent as string) ?? "";
  const fields = (dbTemplate.fields as Template["fields"]) ?? [];
  return {
    id: dbTemplate.id as string,
    title: dbTemplate.title as string,
    description: (dbTemplate.description as string) ?? "",
    htmlContent,
    fields: Array.isArray(fields) ? fields : [],
    created_at: (dbTemplate.created_at as string) ?? new Date().toISOString(),
  };
}
