"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Loader2, Megaphone } from "lucide-react";
import { createAnnouncementAction } from "@/app/actions/announcement";
import QuestionRenderer from "@/components/announcements/question-renderer";
import { toast } from "sonner";
import { useCommunityManagement } from "@/components/community/community-management-context";
import { motion } from "framer-motion";

export default function CommunityCreateAnnouncementPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    link: "",
    isOpportunity: false,
    response: {},
  });

  const { selectedTenantId, isLoading: contextLoading } = useCommunityManagement();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenantId) {
      toast.error("No active community selected.");
      return;
    }
    setIsLoading(true);

    try {
      const result = await createAnnouncementAction(selectedTenantId, formData);
      
      if (result.success) {
        toast.success("Announcement created successfully!");
        router.push("/community-management/announcements");
      } else {
        toast.error(result.error || "Failed to create announcement");
      }
    } catch (error) {
      console.error("Error creating announcement:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean | Record<string, unknown>) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (contextLoading && !selectedTenantId) {
    return <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
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
          <h1 className="text-3xl font-bold font-serif">Create Announcement</h1>
          <p className="text-muted-foreground font-sans">
            Broadcast a new update to your community members.
          </p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="rounded-[2rem] border-border/50 shadow-lg overflow-hidden bg-card/50 backdrop-blur-sm">
          <CardHeader className="bg-muted/30 p-8 border-b border-border/50">
            <CardTitle className="font-serif text-2xl">Announcement Details</CardTitle>
            <CardDescription className="font-sans text-base">
              Fill in the details for your announcement. Standard announcements keep everyone informed, while opportunities allow for applications.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-3">
                <Label htmlFor="title" className="text-sm font-bold uppercase tracking-widest text-muted-foreground ml-1">Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Weekly Community Sync"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  required
                  disabled={isLoading}
                  className="rounded-xl h-12 bg-background border-border/50"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="description" className="text-sm font-bold uppercase tracking-widest text-muted-foreground ml-1">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Provide more context about this announcement..."
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  rows={4}
                  disabled={isLoading}
                  className="rounded-2xl bg-background border-border/50 p-4"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="link" className="text-sm font-bold uppercase tracking-widest text-muted-foreground ml-1">Reference Link</Label>
                <Input
                  id="link"
                  type="url"
                  placeholder="https://example.com/details"
                  value={formData.link}
                  onChange={(e) => handleInputChange("link", e.target.value)}
                  disabled={isLoading}
                  className="rounded-xl h-12 bg-background border-border/50"
                />
              </div>

              <div className="bg-secondary/30 p-6 rounded-2xl border border-border/50 space-y-4">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="isOpportunity"
                    checked={formData.isOpportunity}
                    onCheckedChange={(checked) => handleInputChange("isOpportunity", checked)}
                    disabled={isLoading}
                    className="h-5 w-5 rounded-md"
                  />
                  <Label htmlFor="isOpportunity" className="text-base font-semibold cursor-pointer">This is an opportunity announcement</Label>
                </div>
                <p className="text-sm text-muted-foreground font-sans pl-8 italic">
                  Opportunities allow community members to apply. You can configure custom application questions below.
                </p>
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
                    onResponseChange={(responses) => handleInputChange("response", responses)}
                  />
                </motion.div>
              )}

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={isLoading || !formData.title.trim()}
                  className="flex-1 h-12 rounded-xl font-bold shadow-lg shadow-primary/20"
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Announcement
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isLoading}
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
