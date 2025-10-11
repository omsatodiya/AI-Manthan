"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2 } from "lucide-react";
import { updateAnnouncementAction } from "@/app/actions/announcement";
import { Announcement } from "@/lib/types";
import { toast } from "sonner";

interface EditAnnouncementFormProps {
  announcement: Announcement | null;
  announcementId: string;
}

export default function EditAnnouncementForm({ announcement, announcementId }: EditAnnouncementFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: announcement?.title || "",
    description: announcement?.description || "",
    link: announcement?.link || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const result = await updateAnnouncementAction(announcementId, formData);
      
      if (result.success) {
        toast.success("Announcement updated successfully!");
        router.push("/admin/announcements");
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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!announcement) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Announcement not found</h1>
          <Button onClick={() => router.push("/admin/announcements")}>
            Back to Announcements
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Edit Announcement</h1>
            <p className="text-muted-foreground">
              Update the announcement details
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Announcement Details</CardTitle>
            <CardDescription>
              Update the details for your announcement. All fields except title are optional.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter announcement title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  required
                  disabled={isSaving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter announcement description (optional)"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  rows={4}
                  disabled={isSaving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="link">Link</Label>
                <Input
                  id="link"
                  type="url"
                  placeholder="https://example.com (optional)"
                  value={formData.link}
                  onChange={(e) => handleInputChange("link", e.target.value)}
                  disabled={isSaving}
                />
              </div>

              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={isSaving || !formData.title.trim()}
                  className="flex-1"
                >
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Announcement
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
