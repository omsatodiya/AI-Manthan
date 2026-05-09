"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, Megaphone } from "lucide-react";
import {
  createAnnouncementAction,
  deleteAnnouncementAction,
  updateAnnouncementAction,
} from "@/app/actions/announcement";
import { Announcement } from "@/lib/types";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { useCommunityManagement } from "@/components/community/community-management-context";
import QuestionRenderer from "@/components/announcements/question-renderer";
import {
  deleteAnnouncementOpportunityAction,
  updateAnnouncementOpportunityAction,
} from "@/app/actions/announcement-opportunity";
import { motion } from "framer-motion";

interface CommunityEditAnnouncementFormProps {
  announcement: Announcement | null;
  announcementId: string;
}

export default function CommunityEditAnnouncementForm({ announcement, announcementId }: CommunityEditAnnouncementFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const initialIsOpportunity = !!announcement?.isOpportunity;
  const [formData, setFormData] = useState({
    title: announcement?.title || "",
    description: announcement?.description || "",
    link: announcement?.link || "",
    isOpportunity: !!announcement?.isOpportunity,
    response: ((announcement as unknown as { response?: Record<string, unknown> | null })
      ?.response ?? {}) as Record<string, unknown>,
  });

  const { selectedTenantId } = useCommunityManagement();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenantId) {
      toast.error("No active community selected.");
      return;
    }
    setIsSaving(true);

    try {
      let result:
        | { success: true; data?: unknown }
        | { success: false; error?: string };

      if (formData.isOpportunity === initialIsOpportunity) {
        if (formData.isOpportunity) {
          result = await updateAnnouncementOpportunityAction(selectedTenantId, announcementId, {
            title: formData.title,
            description: formData.description,
            link: formData.link,
            response: formData.response,
          });
        } else {
          result = await updateAnnouncementAction(selectedTenantId, announcementId, {
            title: formData.title,
            description: formData.description,
            link: formData.link,
          });
        }
      } else {
        // Type toggled: migrate between tables.
        if (formData.isOpportunity) {
          const created = await createAnnouncementAction(selectedTenantId, {
            title: formData.title,
            description: formData.description,
            link: formData.link,
            isOpportunity: true,
            response: formData.response,
          });
          if (!created.success) result = created;
          else result = await deleteAnnouncementAction(selectedTenantId, announcementId);
        } else {
          const created = await createAnnouncementAction(selectedTenantId, {
            title: formData.title,
            description: formData.description,
            link: formData.link,
            isOpportunity: false,
          });
          if (!created.success) result = created;
          else result = await deleteAnnouncementOpportunityAction(selectedTenantId, announcementId);
        }
      }
      
      if (result.success) {
        toast.success("Announcement updated successfully!");
        router.push("/community-management/announcements");
      } else {
        toast.error(result.error || "Failed to update announcement");
      }
    } catch (error) {
      console.error("Error updating announcement:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (
    field: "title" | "description" | "link" | "isOpportunity" | "response",
    value: string | boolean | Record<string, unknown>
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!announcement) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <h2 className="text-2xl font-serif font-medium">Announcement not found</h2>
        <Button onClick={() => router.push("/community-management/announcements")} className="rounded-xl">
          Back to Announcements
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="rounded-xl"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold font-serif">Edit Announcement</h1>
          <p className="text-muted-foreground font-sans">
            Update the announcement details for your community.
          </p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="rounded-[2rem] border-border/50 shadow-lg overflow-hidden bg-card/50 backdrop-blur-sm">
          <CardHeader className="bg-muted/30 p-8 border-b border-border/50">
            <CardTitle className="font-serif text-2xl">Edit Details</CardTitle>
            <CardDescription className="font-sans text-base">
              Modify the title, description, or reference link. You can also toggle the opportunity type.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="bg-secondary/30 p-6 rounded-2xl border border-border/50 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="isOpportunity" className="text-base font-semibold cursor-pointer">
                      Opportunity Announcement
                    </Label>
                    <p className="text-sm text-muted-foreground font-sans italic">
                      Enable this to add/edit application questions.
                    </p>
                  </div>
                  <Switch
                    id="isOpportunity"
                    checked={formData.isOpportunity}
                    onCheckedChange={(checked) =>
                      handleInputChange("isOpportunity", checked)
                    }
                    disabled={isSaving}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="title" className="text-sm font-bold uppercase tracking-widest text-muted-foreground ml-1">Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter announcement title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  required
                  disabled={isSaving}
                  className="rounded-xl h-12 bg-background border-border/50"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="description" className="text-sm font-bold uppercase tracking-widest text-muted-foreground ml-1">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter announcement description (optional)"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  rows={4}
                  disabled={isSaving}
                  className="rounded-2xl bg-background border-border/50 p-4"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="link" className="text-sm font-bold uppercase tracking-widest text-muted-foreground ml-1">Reference Link</Label>
                <Input
                  id="link"
                  type="url"
                  placeholder="https://example.com (optional)"
                  value={formData.link}
                  onChange={(e) => handleInputChange("link", e.target.value)}
                  disabled={isSaving}
                  className="rounded-xl h-12 bg-background border-border/50"
                />
              </div>

              {formData.isOpportunity && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="pt-4 border-t border-border/50"
                >
                  <div className="flex items-center gap-2 mb-4 text-primary font-bold">
                    <Megaphone className="h-4 w-4" />
                    Application Questions
                  </div>
                  <QuestionRenderer
                    responses={formData.response}
                    onResponseChange={(responses) =>
                      handleInputChange("response", responses)
                    }
                  />
                </motion.div>
              )}

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={isSaving || !formData.title.trim()}
                  className="flex-1 h-12 rounded-xl font-bold shadow-lg shadow-primary/20"
                >
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Announcement
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isSaving}
                  className="h-12 rounded-xl font-bold px-8"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
