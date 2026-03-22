"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  Loader2,
  Calendar,
  Megaphone,
  Eye,
} from "lucide-react";
import { deleteAnnouncementAction } from "@/app/actions/announcement";
import {
  getAnnouncementsListCached,
  invalidateAdminAnnouncementsCache,
} from "@/lib/admin-announcements-cache";
import { Announcement } from "@/lib/types";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AdminAnnouncementsPage() {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewingAnnouncement, setViewingAnnouncement] =
    useState<Announcement | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isNavigating, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await getAnnouncementsListCached();
        if (cancelled) return;
        if (result.success) {
          setAnnouncements((result.data || []).map((announcement) => ({
            ...announcement,
            createdBy:
              "userId" in announcement
                ? announcement.userId
                : announcement.createdBy,
          })));
        } else {
          toast.error(result.error || "Failed to fetch announcements");
        }
      } catch (error) {
        console.error("Error fetching announcements:", error);
        if (!cancelled) toast.error("An unexpected error occurred");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const result = await deleteAnnouncementAction(id);
      if (result.success) {
        toast.success("Announcement deleted successfully!");
        invalidateAdminAnnouncementsCache();
        setAnnouncements((prev) => prev.filter((ann) => ann.id !== id));
      } else {
        toast.error(result.error || "Failed to delete announcement");
      }
    } catch (error) {
      console.error("Error deleting announcement:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="container mx-auto py-8 px-4">
          <div className="flex items-center justify-center min-h-[600px]">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading announcements...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="mb-4 -ml-2 hover:bg-accent"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            
            <div className="flex items-end justify-between">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                  Announcements
                </h1>
                <p className="text-muted-foreground text-lg">
                  Manage and organize announcements for your organization
                </p>
              </div>
              <Button
                onClick={() => router.push("/announcements/create-announcement")}
                size="lg"
                className="shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Announcement
              </Button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="mb-6">
            <div className="bg-card/50 backdrop-blur border rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-sm font-medium">
                    {announcements.length} Total Announcement{announcements.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          {announcements.length === 0 ? (
            <div className="border-dashed border-2 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="flex flex-col items-center justify-center py-16">
                <div className="rounded-full bg-muted/50 p-6 mb-6">
                  <Plus className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-2xl font-semibold mb-2">No announcements yet</h3>
                <p className="text-muted-foreground mb-6 text-center max-w-md">
                  Get started by creating your first announcement to keep your team informed
                </p>
                <Button
                  onClick={() => router.push("/announcements/create-announcement")}
                  size="lg"
                  className="shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create Your First Announcement
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-card rounded-lg border shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold text-center">
                      Title
                    </TableHead>
                    <TableHead className="font-semibold text-center">
                      Description
                    </TableHead>
                    <TableHead className="font-semibold text-center">
                      Type
                    </TableHead>
                    <TableHead className="font-semibold text-center">
                      Created Date
                    </TableHead>
                    <TableHead className="font-semibold text-center">
                      Link
                    </TableHead>
                    <TableHead className="font-semibold text-center w-[140px]">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {announcements.map((announcement) => (
                    <TableRow key={announcement.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        <div className="max-w-[200px] truncate" title={announcement.title}>
                          {announcement.title}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[300px] truncate" title={announcement.description || ''}>
                          {announcement.description || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {announcement.isOpportunity ? (
                          <Badge 
                            variant="default" 
                            className="gap-1.5 px-2 py-1 font-normal shadow-sm bg-green-600 hover:bg-green-700"
                          >
                            <Megaphone className="h-3 w-3" />
                            Opportunity
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="px-2 py-1 font-normal">
                            Announcement
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(announcement.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {announcement.link ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(announcement.link!, "_blank")}
                            className="gap-2 hover:bg-accent transition-all duration-200"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            View
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setViewingAnnouncement(announcement)}
                          >
                            <span className="sr-only">View announcement</span>
                            <Eye className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              startTransition(() => {
                                setEditingId(announcement.id);
                                router.push(
                                  `/announcements/edit-announcement/${announcement.id}`
                                );
                              })
                            }
                            disabled={isNavigating || deletingId === announcement.id}
                          >
                            <span className="sr-only">Edit announcement</span>
                            {isNavigating && editingId === announcement.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Edit className="h-4 w-4" />
                            )}
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                disabled={deletingId === announcement.id}
                              >
                                <span className="sr-only">Delete announcement</span>
                                {deletingId === announcement.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="max-w-md">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-xl">
                                  Delete Announcement
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-base pt-2">
                                  Are you sure you want to delete &quot;
                                  {announcement.title}
                                  &quot;? This action cannot be undone and the
                                  announcement will be permanently removed.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(announcement.id)}
                                  disabled={deletingId === announcement.id}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete Permanently
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      <Dialog
        open={!!viewingAnnouncement}
        onOpenChange={(open) => (open ? null : setViewingAnnouncement(null))}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {viewingAnnouncement?.title ?? ""}
            </DialogTitle>
            <DialogDescription className="pt-2">
              Announcement details
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div className="grid gap-2">
              <div className="text-sm font-medium">Description</div>
              <div className="max-h-64 overflow-auto rounded-md border bg-muted/20 p-3 text-sm leading-relaxed whitespace-pre-wrap break-words">
                {viewingAnnouncement?.description || "No description provided."}
              </div>
            </div>

            <div className="grid gap-2">
              <div className="text-sm font-medium">Type</div>
              <div>
                {viewingAnnouncement?.isOpportunity ? (
                  <Badge className="gap-1.5 px-2 py-1 font-normal shadow-sm bg-green-600 hover:bg-green-700">
                    <Megaphone className="h-3 w-3" />
                    Opportunity
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="px-2 py-1 font-normal">
                    Announcement
                  </Badge>
                )}
              </div>
            </div>

            <div className="grid gap-2">
              <div className="text-sm font-medium">Date</div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {viewingAnnouncement?.createdAt
                  ? formatDate(viewingAnnouncement.createdAt)
                  : "-"}
              </div>
            </div>

            <div className="grid gap-2">
              <div className="text-sm font-medium">Link</div>
              {viewingAnnouncement?.link ? (
                <div className="flex items-center justify-between gap-3 rounded-md border p-3">
                  <div className="min-w-0">
                    <div className="text-sm text-muted-foreground break-all">
                      {viewingAnnouncement.link}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() =>
                      window.open(viewingAnnouncement.link!, "_blank")
                    }
                    className="gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open
                  </Button>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">-</div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}