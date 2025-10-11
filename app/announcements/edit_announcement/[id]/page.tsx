import { getAnnouncementsAction } from "@/app/actions/announcement";
import { Announcement } from "@/lib/types";
import EditAnnouncementForm from "./edit-form";

interface EditAnnouncementPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditAnnouncementPage({ params }: EditAnnouncementPageProps) {
  const { id } = await params;
  
  const result = await getAnnouncementsAction();
  let announcement: Announcement | null = null;
  if (result.success && result.data) {
    announcement = result.data.find(ann => ann.id === id) as Announcement | null;
  }

  return <EditAnnouncementForm announcement={announcement} announcementId={id} />;
}
