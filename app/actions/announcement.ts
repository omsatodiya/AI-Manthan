"use server";

import { getDb } from "@/lib/database";
import { getCurrentUserAction } from "./auth";
import { CreateAnnouncementData, UpdateAnnouncementData } from "@/lib/types";

export async function createAnnouncementAction(data: CreateAnnouncementData) {
  try {
    const user = await getCurrentUserAction();
    if (!user || user.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    if (!user.tenantId) {
      return { success: false, error: "No tenant selected" };
    }

    const db = await getDb();
    const announcement = await db.createAnnouncement(
      data,
      user.tenantId,
      user.id
    );

    if (!announcement) {
      return { success: false, error: "Failed to create announcement" };
    }

    return { success: true, data: announcement };
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
    const announcements = await db.getAnnouncements(user.tenantId);

    return { success: true, data: announcements };
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
