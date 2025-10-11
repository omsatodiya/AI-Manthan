"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Loader2, Calendar } from "lucide-react";
import { getAnnouncementsAction } from "@/app/actions/announcement";
import { Announcement } from "@/lib/types";
import { toast } from "sonner";

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const result = await getAnnouncementsAction();
      if (result.success) {
        setAnnouncements(result.data?.map(item => ({
          ...item,
          createdBy: 'createdBy' in item ? item.createdBy : item.userId
        })) || []);
      } else {
        toast.error(result.error || "Failed to fetch announcements");
      }
    } catch (error) {
      console.error("Error fetching announcements:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 pt-16">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 pt-16">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Announcements</h1>
          <p className="text-lg text-muted-foreground">
            Stay updated with the latest news and updates from our organization
          </p>
        </div>

        {announcements.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No announcements yet</h3>
                <p className="text-muted-foreground">
                  Check back later for updates and announcements
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {announcements.map((announcement) => (
              <Card key={announcement.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-2xl mb-2">
                        {announcement.title}
                      </CardTitle>
                      {announcement.description && (
                        <CardDescription className="text-base leading-relaxed">
                          {announcement.description}
                        </CardDescription>
                      )}
                    </div>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(announcement.createdAt)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {announcement.link && (
                    <Button
                      variant="outline"
                      onClick={() => announcement.link && window.open(announcement.link, "_blank")}
                      className="flex items-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Learn More
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
