"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Edit, Trash2, ExternalLink, Loader2, Calendar, Megaphone, MoreHorizontal } from "lucide-react";
import { getAnnouncementsAction, deleteAnnouncementAction } from "@/app/actions/announcement";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const result = await getAnnouncementsAction();
      if (result.success) {
        setAnnouncements((result.data || []).map(announcement => ({
          ...announcement,
          createdBy: 'userId' in announcement ? announcement.userId : announcement.createdBy
        })));
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

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const result = await deleteAnnouncementAction(id);
      if (result.success) {
        toast.success("Announcement deleted successfully!");
        setAnnouncements(prev => prev.filter(ann => ann.id !== id));
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
                onClick={() => router.push("/admin/create_announcement")}
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
                  onClick={() => router.push("/admin/create_announcement")}
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
                    <TableHead className="font-semibold">Title</TableHead>
                    <TableHead className="font-semibold">Description</TableHead>
                    <TableHead className="font-semibold">Type</TableHead>
                    <TableHead className="font-semibold">Created Date</TableHead>
                    <TableHead className="font-semibold">Link</TableHead>
                    <TableHead className="font-semibold w-[50px]"></TableHead>
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
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => router.push(`/admin/edit_announcement/${announcement.id}`)}
                              className="gap-2"
                            >
                              <Edit className="h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                  className="gap-2 text-destructive focus:text-destructive"
                                  onSelect={(e) => e.preventDefault()}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="max-w-md">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-xl">Delete Announcement</AlertDialogTitle>
                                  <AlertDialogDescription className="text-base pt-2">
                                    Are you sure you want to delete &quot;{announcement.title}&quot;? This action cannot be undone and the announcement will be permanently removed.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(announcement.id)}
                                    disabled={deletingId === announcement.id}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    {deletingId === announcement.id && (
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    )}
                                    Delete Permanently
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}