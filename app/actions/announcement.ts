"use server";

import { getDb } from "@/lib/database";
import { getCurrentUserAction } from "./auth";
import { CreateAnnouncementData, UpdateAnnouncementData, Announcement } from "@/lib/types";
import { CreateAnnouncementOpportunityData } from "@/lib/types";
import { revalidatePath } from "next/cache";

export async function createAnnouncementAction(
  data: CreateAnnouncementData & { isOpportunity?: boolean; response?: Record<string, unknown> }
) {
  try {
    const user = await getCurrentUserAction();
    if (!user || user.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    if (!user.tenantId) {
      return { success: false, error: "No tenant selected" };
    }

    const db = await getDb();
    
    if (data.isOpportunity) {
      // Create opportunity announcement
      const opportunityData: CreateAnnouncementOpportunityData = {
        title: data.title,
        description: data.description,
        link: data.link,
        tenantId: user.tenantId,
        userId: user.id,
        response: data.response,
      };
      
      const opportunity = await db.createAnnouncementOpportunity(opportunityData);
      
      if (!opportunity) {
        return { success: false, error: "Failed to create opportunity announcement" };
      }

      revalidatePath("/admin/announcements");
      revalidatePath("/announcements");
      
      return { success: true, data: { ...opportunity, createdBy: opportunity.userId } as Announcement };
    } else {
      // Create regular announcement
      const announcement = await db.createAnnouncement(
        {
          title: data.title,
          description: data.description,
          link: data.link,
        },
        user.tenantId,
        user.id
      );

      if (!announcement) {
        return { success: false, error: "Failed to create announcement" };
      }

      revalidatePath("/admin/announcements");
      revalidatePath("/announcements");

      return { success: true, data: announcement };
    }
  } catch (error) {
    console.error("Error creating announcement:", error);
    return { success: false, error: "Internal server error" };
  }
}

export async function getAnnouncementsAction() {
  try {
    const user = await getCurrentUserAction();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    if (!user.tenantId) {
      return { success: false, error: "No tenant selected" };
    }

    const db = await getDb();
    
    // Fetch both regular announcements and opportunities
    const [announcements, opportunities] = await Promise.all([
      db.getAnnouncements(user.tenantId),
      db.getAnnouncementOpportunities(user.tenantId)
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
  id: string,
  data: UpdateAnnouncementData
) {
  try {
    const user = await getCurrentUserAction();
    if (!user || user.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    if (!user.tenantId) {
      return { success: false, error: "No tenant selected" };
    }

    const db = await getDb();
    const announcement = await db.updateAnnouncement(id, data, user.tenantId);

    if (!announcement) {
      return { success: false, error: "Failed to update announcement" };
    }

    return { success: true, data: announcement };
  } catch (error) {
    console.error("Error updating announcement:", error);
    return { success: false, error: "Internal server error" };
  }
}

export async function deleteAnnouncementAction(id: string) {
  try {
    const user = await getCurrentUserAction();
    if (!user || user.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    if (!user.tenantId) {
      return { success: false, error: "No tenant selected" };
    }

    const db = await getDb();
    const success = await db.deleteAnnouncement(id, user.tenantId);

    if (!success) {
      return { success: false, error: "Failed to delete announcement" };
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting announcement:", error);
    return { success: false, error: "Internal server error" };
  }
}
