"use server";

import { getDb } from "@/lib/database";
import { getCurrentUserAction } from "./auth";
import { CreateAnnouncementData, UpdateAnnouncementData, Announcement } from "@/lib/types";
import { CreateAnnouncementOpportunityData } from "@/lib/types";
import { revalidatePath } from "next/cache";

export async function createAnnouncementAction(
  tenantId: string,
  data: CreateAnnouncementData & { isOpportunity?: boolean; response?: Record<string, unknown> }
) {
  try {
    const user = await getCurrentUserAction();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    if (!tenantId) {
      return { success: false, error: "No tenant selected" };
    }

    const db = await getDb();
    
    if (data.isOpportunity) {
      // Create opportunity announcement
      const opportunityData: CreateAnnouncementOpportunityData = {
        title: data.title,
        description: data.description,
        link: data.link,
        tenantId,
        userId: user.id,
        response: data.response,
      };
      
      const opportunity = await db.createAnnouncementOpportunity(opportunityData);
      
      if (!opportunity) {
        return { success: false, error: "Failed to create opportunity announcement" };
      }

      revalidatePath("/admin/announcements");
      revalidatePath("/announcements");
      revalidatePath("/community-management/announcements");
      
      return { success: true, data: { ...opportunity, createdBy: opportunity.userId } as Announcement };
    } else {
      // Create regular announcement
      const announcement = await db.createAnnouncement(
        {
          title: data.title,
          description: data.description,
          link: data.link,
        },
        tenantId,
        user.id
      );

      if (!announcement) {
        return { success: false, error: "Failed to create announcement" };
      }

      revalidatePath("/admin/announcements");
      revalidatePath("/announcements");
      revalidatePath("/community-management/announcements");

      return { success: true, data: announcement };
    }
  } catch (error) {
    console.error("Error creating announcement:", error);
    return { success: false, error: "Internal server error" };
  }
}

export async function getAnnouncementsAction(tenantId: string) {
  try {
    const user = await getCurrentUserAction();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    if (!tenantId) {
      return { success: false, error: "No tenant selected" };
    }

    const db = await getDb();
    
    // Fetch both regular announcements and opportunities
    const [announcements, opportunities] = await Promise.all([
      db.getAnnouncements(tenantId),
      db.getAnnouncementOpportunities(tenantId)
    ]);

    // Combine and sort by creation date
    const allAnnouncements = [
      ...announcements,
      ...opportunities.map(opp => ({
        ...opp,
        isOpportunity: true
      }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return { success: true, data: allAnnouncements };
  } catch (error) {
    console.error("Error fetching announcements:", error);
    return { success: false, error: "Internal server error" };
  }
}

export async function updateAnnouncementAction(
  tenantId: string,
  id: string,
  data: UpdateAnnouncementData
) {
  try {
    const user = await getCurrentUserAction();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    if (!tenantId) {
      return { success: false, error: "No tenant selected" };
    }

    const db = await getDb();
    const announcement = await db.updateAnnouncement(id, data, tenantId);

    if (!announcement) {
      return { success: false, error: "Failed to update announcement" };
    }

    revalidatePath("/admin/announcements");
    revalidatePath("/announcements");
    revalidatePath("/community-management/announcements");

    return { success: true, data: announcement };
  } catch (error) {
    console.error("Error updating announcement:", error);
    return { success: false, error: "Internal server error" };
  }
}

export async function deleteAnnouncementAction(tenantId: string, id: string) {
  try {
    const user = await getCurrentUserAction();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    if (!tenantId) {
      return { success: false, error: "No tenant selected" };
    }

    const db = await getDb();
    const success = await db.deleteAnnouncement(id, tenantId);

    if (!success) {
      return { success: false, error: "Failed to delete announcement" };
    }

    revalidatePath("/admin/announcements");
    revalidatePath("/announcements");
    revalidatePath("/community-management/announcements");

    return { success: true };
  } catch (error) {
    console.error("Error deleting announcement:", error);
    return { success: false, error: "Internal server error" };
  }
}
