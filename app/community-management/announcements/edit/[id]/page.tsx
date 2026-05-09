"use client";

import { useEffect, useState } from "react";
import { getAnnouncementsAction } from "@/app/actions/announcement";
import { Announcement } from "@/lib/types";
import CommunityEditAnnouncementForm from "./edit-form";
import { useCommunityManagement } from "@/components/community/community-management-context";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import React from "react";

interface EditAnnouncementPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function CommunityEditAnnouncementPage({ params }: EditAnnouncementPageProps) {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [id, setId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { selectedTenantId, isLoading: contextLoading } = useCommunityManagement();

  const unwrappedParams = React.use(params);

  useEffect(() => {
    setId(unwrappedParams.id);
  }, [unwrappedParams]);

  useEffect(() => {
    if (!id || contextLoading || !selectedTenantId) return;

    const fetchAnnouncement = async () => {
      try {
        const result = await getAnnouncementsAction(selectedTenantId);
        if (result.success && result.data) {
          const found = result.data.find(ann => ann.id === id) as Announcement | null;
          setAnnouncement(found);
        } else {
          toast.error("Failed to load announcement");
        }
      } catch (error) {
        console.error("Error fetching announcement:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnnouncement();
  }, [id, selectedTenantId, contextLoading]);

  if (contextLoading || isLoading || !id) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return <CommunityEditAnnouncementForm announcement={announcement} announcementId={id} />;
}
