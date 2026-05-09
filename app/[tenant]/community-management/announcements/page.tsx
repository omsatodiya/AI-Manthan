"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
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
import { useCommunityManagement } from "@/components/community/community-management-context";
import { motion } from "framer-motion";

export default function CommunityAnnouncementsPage() {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewingAnnouncement, setViewingAnnouncement] =
    useState<Announcement | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isNavigating, startTransition] = useTransition();
  const { selectedTenantId, isLoading: contextLoading } = useCommunityManagement();

  useEffect(() => {
    let cancelled = false;
    if (contextLoading || !selectedTenantId) return;
    (async () => {
      try {
        setIsLoading(true);
        const result = await getAnnouncementsListCached(selectedTenantId);
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
  }, [selectedTenantId, contextLoading]);

  const handleDelete = async (id: string) => {
    if (!selectedTenantId) return;
    setDeletingId(id);
    try {
      const result = await deleteAnnouncementAction(selectedTenantId, id);
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

  if (contextLoading && !selectedTenantId) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h2 className="text-2xl font-serif font-medium">Community Announcements</h2>
          <p className="text-sm text-muted-foreground">Broadcast updates and opportunities to your node members.</p>
        </div>
        <Button 
          onClick={() => router.push("/community-management/announcements/create")}
          className="rounded-xl shadow-lg shadow-primary/20 gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Announcement
        </Button>
      </motion.div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card/50 backdrop-blur border border-border/50 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Megaphone className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total</p>
            <p className="text-xl font-bold font-sans">{announcements.length}</p>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border/50 rounded-3xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : announcements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <Megaphone className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-serif font-medium mb-2">No announcements yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-6">
              Start broadcasting updates to your community members by creating your first announcement.
            </p>
            <Button 
              variant="outline" 
              onClick={() => router.push("/community-management/announcements/create")}
              className="rounded-xl"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Announcement
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="font-bold py-4">Title</TableHead>
                  <TableHead className="font-bold">Type</TableHead>
                  <TableHead className="font-bold">Date</TableHead>
                  <TableHead className="font-bold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {announcements.map((announcement) => (
                  <TableRow key={announcement.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell className="py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{announcement.title}</span>
                        <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {announcement.description || "No description"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {announcement.isOpportunity ? (
                        <Badge 
                          className="gap-1.5 px-2 py-0.5 font-bold uppercase tracking-tighter text-[10px] shadow-sm bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20"
                        >
                          <Megaphone className="h-3 w-3" />
                          Opportunity
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="px-2 py-0.5 font-bold uppercase tracking-tighter text-[10px]">
                          Announcement
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(announcement.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-xl"
                          onClick={() => setViewingAnnouncement(announcement)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-xl"
                          onClick={() =>
                            startTransition(() => {
                              setEditingId(announcement.id);
                              router.push(
                                `/community-management/announcements/edit/${announcement.id}`
                              );
                            })
                          }
                          disabled={isNavigating || deletingId === announcement.id}
                        >
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
                              className="h-9 w-9 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10"
                              disabled={deletingId === announcement.id}
                            >
                              {deletingId === announcement.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-3xl border-border/50">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="font-serif">
                                Delete Announcement
                              </AlertDialogTitle>
                              <AlertDialogDescription className="font-sans">
                                Are you sure you want to delete &quot;{announcement.title}&quot;? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(announcement.id)}
                                disabled={deletingId === announcement.id}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
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

      <Dialog
        open={!!viewingAnnouncement}
        onOpenChange={(open) => (open ? null : setViewingAnnouncement(null))}
      >
        <DialogContent className="max-w-2xl rounded-3xl border-border/50">
          <DialogHeader>
            <DialogTitle className="text-2xl font-serif">
              {viewingAnnouncement?.title ?? ""}
            </DialogTitle>
            <DialogDescription className="font-sans">
              Announcement details
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div className="grid gap-2">
              <div className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Description</div>
              <div className="max-h-64 overflow-auto rounded-2xl border bg-muted/20 p-4 text-sm leading-relaxed whitespace-pre-wrap break-words font-sans">
                {viewingAnnouncement?.description || "No description provided."}
              </div>
            </div>

            <div className="flex flex-wrap gap-6">
              <div className="grid gap-2">
                <div className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Type</div>
                <div>
                  {viewingAnnouncement?.isOpportunity ? (
                    <Badge className="gap-1.5 px-3 py-1 font-bold uppercase tracking-tighter shadow-sm bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20">
                      <Megaphone className="h-3 w-3" />
                      Opportunity
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="px-3 py-1 font-bold uppercase tracking-tighter">
                      Announcement
                    </Badge>
                  )}
                </div>
              </div>

              <div className="grid gap-2">
                <div className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Date</div>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Calendar className="h-4 w-4 text-primary" />
                  {viewingAnnouncement?.createdAt
                    ? formatDate(viewingAnnouncement.createdAt)
                    : "-"}
                </div>
              </div>
            </div>

            {viewingAnnouncement?.link && (
              <div className="grid gap-2">
                <div className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Reference Link</div>
                <div className="flex items-center justify-between gap-3 rounded-2xl border p-4 bg-card/50">
                  <div className="min-w-0">
                    <div className="text-sm text-muted-foreground truncate font-sans">
                      {viewingAnnouncement.link}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() =>
                      window.open(viewingAnnouncement.link!, "_blank")
                    }
                    className="gap-2 rounded-xl"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Visit
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
