import { getSupabaseClient } from "../database/clients";
import { 
  TenantApplication, 
  CreateTenantApplicationData, 
  ReviewTenantApplicationData,
  ApplicationStatus 
} from "../types/tenant-application";

export const tenantApplicationFunctions = {
  async createTenantApplication(
    applicantId: string,
    data: CreateTenantApplicationData
  ): Promise<TenantApplication | null> {
    const supabase = await getSupabaseClient();
    const { data: result, error } = await supabase
      .from("tenant_applications")
      .insert({
        applicant_id: applicantId,
        company_name: data.orgName, 
        requested_slug: data.requestedSlug,
        company_description: data.description,
        status: "pending",
      })
      .select()
      .single();

    if (error) console.error(error);
    if (!result) return null;
    
    return {
      id: result.id as string,
      applicantId: result.applicant_id as string,
      orgName: result.company_name as string,
      requestedSlug: result.requested_slug as string,
      description: result.company_description as string | null,
      status: result.status as ApplicationStatus,
      reviewedBy: result.reviewed_by as string | null,
      reviewedAt: result.reviewed_at as string | null,
      rejectionNote: result.rejection_note as string | null,
      createdAt: result.created_at as string,
      updatedAt: result.updated_at as string,
    };
  },

  async getTenantApplications(status?: ApplicationStatus): Promise<TenantApplication[]> {
    const supabase = await getSupabaseClient();
    let query = supabase.from("tenant_applications").select("*");
    
    if (status) {
      query = query.eq("status", status);
    }
    
    query = query.order("created_at", { ascending: false });

    const { data, error } = await query;
    if (error) console.error(error);
    if (!data) return [];

    return data.map((result: Record<string, unknown>) => ({
      id: result.id as string,
      applicantId: result.applicant_id as string,
      orgName: result.company_name as string,
      requestedSlug: result.requested_slug as string,
      description: result.company_description as string | null,
      status: result.status as ApplicationStatus,
      reviewedBy: result.reviewed_by as string | null,
      reviewedAt: result.reviewed_at as string | null,
      rejectionNote: result.rejection_note as string | null,
      createdAt: result.created_at as string,
      updatedAt: result.updated_at as string,
    }));
  },

  async getMyTenantApplications(applicantId: string): Promise<TenantApplication[]> {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from("tenant_applications")
      .select("*")
      .eq("applicant_id", applicantId)
      .order("created_at", { ascending: false });

    if (error) console.error(error);
    if (!data) return [];

    return data.map((result: Record<string, unknown>) => ({
      id: result.id as string,
      applicantId: result.applicant_id as string,
      orgName: result.company_name as string,
      requestedSlug: result.requested_slug as string,
      description: result.company_description as string | null,
      status: result.status as ApplicationStatus,
      reviewedBy: result.reviewed_by as string | null,
      reviewedAt: result.reviewed_at as string | null,
      rejectionNote: result.rejection_note as string | null,
      createdAt: result.created_at as string,
      updatedAt: result.updated_at as string,
    }));
  },

  async updateTenantApplication(
    id: string,
    data: ReviewTenantApplicationData,
    reviewedBy: string
  ): Promise<TenantApplication | null> {
    const supabase = await getSupabaseClient();
    const updatePayload = {
      status: data.status,
      rejection_note: data.rejectionNote,
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: result, error } = await supabase
      .from("tenant_applications")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) console.error(error);
    if (!result) return null;

    return {
      id: result.id as string,
      applicantId: result.applicant_id as string,
      orgName: result.company_name as string,
      requestedSlug: result.requested_slug as string,
      description: result.company_description as string | null,
      status: result.status as ApplicationStatus,
      reviewedBy: result.reviewed_by as string | null,
      reviewedAt: result.reviewed_at as string | null,
      rejectionNote: result.rejection_note as string | null,
      createdAt: result.created_at as string,
      updatedAt: result.updated_at as string,
    };
  }
};
