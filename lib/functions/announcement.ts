import { createClient } from "@supabase/supabase-js";
import { Announcement, CreateAnnouncementData, UpdateAnnouncementData } from "../types/announcement";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

export const announcementFunctions = {
  async createAnnouncement(
    data: CreateAnnouncementData,
    tenantId: string,
    createdBy: string
  ): Promise<Announcement | null> {
    try {
      const { data: announcement, error } = await supabase
        .from("announcements")
        .insert({
          title: data.title,
          description: data.description,
          link: data.link,
          tenant_id: tenantId,
          created_by: createdBy,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating announcement:", error);
        return null;
      }

      return {
        id: announcement.id,
        title: announcement.title,
        description: announcement.description,
        link: announcement.link,
        tenantId: announcement.tenant_id,
        createdBy: announcement.created_by,
        createdAt: announcement.created_at,
      };
    } catch (error) {
      console.error("Error creating announcement:", error);
      return null;
    }
  },

  async getAnnouncements(tenantId: string): Promise<Announcement[]> {
    try {
      const { data: announcements, error } = await supabase
        .from("announcements")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching announcements:", error);
        return [];
      }

      return announcements.map((announcement) => ({
        id: announcement.id,
        title: announcement.title,
        description: announcement.description,
        link: announcement.link,
        tenantId: announcement.tenant_id,
        createdBy: announcement.created_by,
        createdAt: announcement.created_at,
      }));
    } catch (error) {
      console.error("Error fetching announcements:", error);
      return [];
    }
  },

  async getAnnouncementById(id: string, tenantId: string): Promise<Announcement | null> {
    try {
      const { data: announcement, error } = await supabase
        .from("announcements")
        .select("*")
        .eq("id", id)
        .eq("tenant_id", tenantId)
        .single();

      if (error) {
        console.error("Error fetching announcement:", error);
        return null;
      }

      return {
        id: announcement.id,
        title: announcement.title,
        description: announcement.description,
        link: announcement.link,
        tenantId: announcement.tenant_id,
        createdBy: announcement.created_by,
        createdAt: announcement.created_at,
      };
    } catch (error) {
      console.error("Error fetching announcement:", error);
      return null;
    }
  },

  async updateAnnouncement(
    id: string,
    data: UpdateAnnouncementData,
    tenantId: string
  ): Promise<Announcement | null> {
    try {
      const { data: announcement, error } = await supabase
        .from("announcements")
        .update({
          title: data.title,
          description: data.description,
          link: data.link,
        })
        .eq("id", id)
        .eq("tenant_id", tenantId)
        .select()
        .single();

      if (error) {
        console.error("Error updating announcement:", error);
        return null;
      }

      return {
        id: announcement.id,
        title: announcement.title,
        description: announcement.description,
        link: announcement.link,
        tenantId: announcement.tenant_id,
        createdBy: announcement.created_by,
        createdAt: announcement.created_at,
      };
    } catch (error) {
      console.error("Error updating announcement:", error);
      return null;
    }
  },

  async deleteAnnouncement(id: string, tenantId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("announcements")
        .delete()
        .eq("id", id)
        .eq("tenant_id", tenantId);

      if (error) {
        console.error("Error deleting announcement:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error deleting announcement:", error);
      return false;
    }
  },
};
