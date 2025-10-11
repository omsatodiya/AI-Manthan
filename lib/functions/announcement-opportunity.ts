import { createClient } from "@supabase/supabase-js";
import { AnnouncementOpportunity, CreateAnnouncementOpportunityData } from "../types/announcement-opportunity";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

export const announcementOpportunityFunctions = {
  async createAnnouncementOpportunity(
    data: CreateAnnouncementOpportunityData
  ): Promise<AnnouncementOpportunity | null> {
    try {
      const { data: opportunity, error } = await supabase
        .from("announcement_opportunity")
        .insert({
          title: data.title,
          description: data.description,
          link: data.link,
          tenant_id: data.tenantId,
          user_id: data.userId,
          response: data.response,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating announcement opportunity:", error);
        return null;
      }

      return {
        id: opportunity.id,
        title: opportunity.title,
        description: opportunity.description,
        link: opportunity.link,
        tenantId: opportunity.tenant_id,
        userId: opportunity.user_id,
        response: opportunity.response,
        createdAt: opportunity.created_at,
      };
    } catch (error) {
      console.error("Error creating announcement opportunity:", error);
      return null;
    }
  },

  async getAnnouncementOpportunities(tenantId: string): Promise<AnnouncementOpportunity[]> {
    try {
      const { data: opportunities, error } = await supabase
        .from("announcement_opportunity")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching announcement opportunities:", error);
        return [];
      }

      return opportunities.map((opportunity) => ({
        id: opportunity.id,
        title: opportunity.title,
        description: opportunity.description,
        link: opportunity.link,
        tenantId: opportunity.tenant_id,
        userId: opportunity.user_id,
        response: opportunity.response,
        createdAt: opportunity.created_at,
      }));
    } catch (error) {
      console.error("Error fetching announcement opportunities:", error);
      return [];
    }
  },

  async getAnnouncementOpportunityById(id: string, tenantId: string): Promise<AnnouncementOpportunity | null> {
    try {
      const { data: opportunity, error } = await supabase
        .from("announcement_opportunity")
        .select("*")
        .eq("id", id)
        .eq("tenant_id", tenantId)
        .single();

      if (error) {
        console.error("Error fetching announcement opportunity:", error);
        return null;
      }

      return {
        id: opportunity.id,
        title: opportunity.title,
        description: opportunity.description,
        link: opportunity.link,
        tenantId: opportunity.tenant_id,
        userId: opportunity.user_id,
        response: opportunity.response,
        createdAt: opportunity.created_at,
      };
    } catch (error) {
      console.error("Error fetching announcement opportunity:", error);
      return null;
    }
  },

  async updateAnnouncementOpportunity(
    id: string,
    data: Partial<CreateAnnouncementOpportunityData>,
    tenantId: string
  ): Promise<AnnouncementOpportunity | null> {
    try {
      const { data: opportunity, error } = await supabase
        .from("announcement_opportunity")
        .update({
          title: data.title,
          description: data.description,
          link: data.link,
          response: data.response,
        })
        .eq("id", id)
        .eq("tenant_id", tenantId)
        .select()
        .single();

      if (error) {
        console.error("Error updating announcement opportunity:", error);
        return null;
      }

      return {
        id: opportunity.id,
        title: opportunity.title,
        description: opportunity.description,
        link: opportunity.link,
        tenantId: opportunity.tenant_id,
        userId: opportunity.user_id,
        response: opportunity.response,
        createdAt: opportunity.created_at,
      };
    } catch (error) {
      console.error("Error updating announcement opportunity:", error);
      return null;
    }
  },

  async deleteAnnouncementOpportunity(id: string, tenantId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("announcement_opportunity")
        .delete()
        .eq("id", id)
        .eq("tenant_id", tenantId);

      if (error) {
        console.error("Error deleting announcement opportunity:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error deleting announcement opportunity:", error);
      return false;
    }
  },

  async getUserAnnouncementOpportunities(
    userId: string,
    tenantId: string
  ): Promise<AnnouncementOpportunity[]> {
    try {
      const { data: opportunities, error } = await supabase
        .from("announcement_opportunity")
        .select("*")
        .eq("user_id", userId)
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching user announcement opportunities:", error);
        return [];
      }

      return opportunities.map((opportunity) => ({
        id: opportunity.id,
        title: opportunity.title,
        description: opportunity.description,
        link: opportunity.link,
        tenantId: opportunity.tenant_id,
        userId: opportunity.user_id,
        response: opportunity.response,
        createdAt: opportunity.created_at,
      }));
    } catch (error) {
      console.error("Error fetching user announcement opportunities:", error);
      return [];
    }
  },
};
