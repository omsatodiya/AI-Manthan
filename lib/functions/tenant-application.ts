import { getSupabaseAdminClient } from "../database/clients";
import {
  TenantApplication,
  CreateTenantApplicationData,
  ReviewTenantApplicationData,
  ApplicationStatus
} from "../types/tenant-application";
import { tenantFunctions } from "./tenant";

export const tenantApplicationFunctions = {
  async createTenantApplication(
    applicantId: string,
    data: CreateTenantApplicationData
  ): Promise<TenantApplication | null> {
    const supabase = await getSupabaseAdminClient();
    const { data: result, error } = await supabase
      .from("tenant_applications")
      .insert({
        applicant_id: applicantId,
        company_name: data.orgName,
        requested_slug: data.requestedSlug,
        company_description: data.description,
        is_public: data.isPublic,
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
      isPublic: result.is_public as boolean,
      status: result.status as ApplicationStatus,
      reviewedBy: result.reviewed_by as string | null,
      reviewedAt: result.reviewed_at as string | null,
      rejectionNote: result.rejection_note as string | null,
      createdAt: result.created_at as string,
      updatedAt: result.updated_at as string,
    };
  },

  async getTenantApplications(params?: {
    status?: ApplicationStatus;
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{ applications: TenantApplication[]; totalCount: number }> {
    const supabase = await getSupabaseAdminClient();
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const offset = (page - 1) * limit;

    let query = supabase.from("tenant_applications").select("*", { count: "exact" });

    if (params?.status) {
      query = query.eq("status", params.status);
    }

    if (params?.search) {
      query = query.or(`company_name.ilike.%${params.search}%,requested_slug.ilike.%${params.search}%`);
    }

    query = query.order("created_at", { ascending: false });
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) console.error(error);
    if (!data) return { applications: [], totalCount: 0 };

    const applications = data.map((result: Record<string, unknown>) => ({
      id: result.id as string,
      applicantId: result.applicant_id as string,
      orgName: result.company_name as string,
      requestedSlug: result.requested_slug as string,
      description: result.company_description as string | null,
      isPublic: result.is_public as boolean,
      status: result.status as ApplicationStatus,
      reviewedBy: result.reviewed_by as string | null,
      reviewedAt: result.reviewed_at as string | null,
      rejectionNote: result.rejection_note as string | null,
      createdAt: result.created_at as string,
      updatedAt: result.updated_at as string,
    }));

    return { applications, totalCount: count || 0 };
  },

  async getMyTenantApplications(applicantId: string): Promise<TenantApplication[]> {
    const supabase = await getSupabaseAdminClient();
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
      isPublic: result.is_public as boolean,
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
    const supabase = await getSupabaseAdminClient();
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

    // Handle automated provisioning if approved
    if (data.status === "approved") {
      try {
        const newTenant = await tenantFunctions.createTenant({
          name: result.company_name,
          slug: result.requested_slug,
          description: result.company_description,
          isPublic: result.is_public,
          settings: {},
        });

        if (newTenant) {
          await tenantFunctions.addTenantMember({
            userId: result.applicant_id,
            tenantId: newTenant.id,
            role: "owner",
            status: "active",
            permissions: ["*"], // Full permissions for owner
          });
          console.log(`Successfully provisioned tenant: ${newTenant.name} (${newTenant.id})`);
        }
      } catch (provisionError) {
        console.error("Failed to provision tenant upon approval:", provisionError);
        // We still return the updated application, but log the error
      }
    }

    return {
      id: result.id as string,
      applicantId: result.applicant_id as string,
      orgName: result.company_name as string,
      requestedSlug: result.requested_slug as string,
      description: result.company_description as string | null,
      isPublic: result.is_public as boolean,
      status: result.status as ApplicationStatus,
      reviewedBy: result.reviewed_by as string | null,
      reviewedAt: result.reviewed_at as string | null,
      rejectionNote: result.rejection_note as string | null,
      createdAt: result.created_at as string,
      updatedAt: result.updated_at as string,
    };
  },

  async deleteTenantApplication(id: string): Promise<boolean> {
    const supabase = await getSupabaseAdminClient();
    const { error } = await supabase
      .from("tenant_applications")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("deleteTenantApplication error:", error);
      return false;
    }
    return true;
  },

  async updateTenantApplicationDetails(
    id: string,
    data: { orgName?: string; requestedSlug?: string; description?: string }
  ): Promise<TenantApplication | null> {
    const supabase = await getSupabaseAdminClient();
    const updatePayload: Record<string, string | null> = {
      updated_at: new Date().toISOString(),
    };

    if (data.orgName) updatePayload.company_name = data.orgName;
    if (data.requestedSlug) updatePayload.requested_slug = data.requestedSlug;
    if (data.description !== undefined) updatePayload.company_description = data.description;

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
      isPublic: result.is_public as boolean,
      status: result.status as ApplicationStatus,
      reviewedBy: result.reviewed_by as string | null,
      reviewedAt: result.reviewed_at as string | null,
      rejectionNote: result.rejection_note as string | null,
      createdAt: result.created_at as string,
      updatedAt: result.updated_at as string,
    };
  }
};
