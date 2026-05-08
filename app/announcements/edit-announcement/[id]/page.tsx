"use client";

import { useEffect, useState } from "react";
import { getAnnouncementsAction } from "@/app/actions/announcement";
import { Announcement } from "@/lib/types";
import EditAnnouncementForm from "./edit-form";
import { useTenant } from "@/contexts/tenant-context";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface EditAnnouncementPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditAnnouncementPage({ params }: EditAnnouncementPageProps) {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [id, setId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { tenantId } = useTenant();

  useEffect(() => {
    params.then(p => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!id || !tenantId) return;

    const fetchAnnouncement = async () => {
      try {
        const result = await getAnnouncementsAction(tenantId);
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
  }, [id, tenantId]);

  if (!id || isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return <EditAnnouncementForm announcement={announcement} announcementId={id} />;
}
