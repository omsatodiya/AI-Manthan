"use client";

import { useState } from "react";
import {
  Check,
  X,
  Trash2,
  Pencil,
  Loader2,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  reviewTenantApplicationAction,
  deleteTenantApplicationAction
} from "@/app/actions/tenant-application";
import { ApplicationStatus } from "@/lib/types/tenant-application";
import { EditTenantApplicationDialog } from "./edit-tenant-application-dialog";

interface TenantApplicationActionsProps {
  applicationId: string;
  status: ApplicationStatus;
  orgName: string;
  requestedSlug: string;
  description: string;
}

export function TenantApplicationActions({
  applicationId,
  status,
  orgName,
  requestedSlug,
  description
}: TenantApplicationActionsProps) {
  const [isPending, setIsPending] = useState(false);
  const [rejectionNote, setRejectionNote] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleAction = async (action: "approve" | "reject" | "delete") => {
    setIsPending(true);
    try {
      let result;
      if (action === "approve") {
        result = await reviewTenantApplicationAction(applicationId, "approved");
      } else if (action === "reject") {
        result = await reviewTenantApplicationAction(applicationId, "rejected", rejectionNote);
      } else {
        result = await deleteTenantApplicationAction(applicationId);
      }

      if (result.success) {
        toast.success(`Application ${action}d successfully`);
        setRejectionNote(""); // Reset note
      } else {
        toast.error(result.error || `Failed to ${action} application`);
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsPending(false);
    }
  };

  const isApproved = status === "approved";
  const isRejected = status === "rejected";

  return (
    <TooltipProvider>
      <div className="flex items-center justify-center gap-2">
        {/* Edit Action */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsEditDialogOpen(true)}
              className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="bg-popover text-popover-foreground border-border/50 font-sans text-xs">
            Edit Application
          </TooltipContent>
        </Tooltip>

        <EditTenantApplicationDialog
          applicationId={applicationId}
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          defaultValues={{
            orgName,
            requestedSlug,
            description
          }}
        />

        {/* Accept Action */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              disabled={isApproved || isPending}
              onClick={() => handleAction("approve")}
              className="h-8 w-8 rounded-lg hover:bg-green-500/10 hover:text-green-600 transition-colors disabled:opacity-30"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent className="bg-popover text-popover-foreground border-border/50 font-sans text-xs">
            Approve Community
          </TooltipContent>
        </Tooltip>

        {/* Reject Action with Confirmation and Optional Note */}
        <AlertDialog>
          <Tooltip>
            <TooltipTrigger asChild>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={isRejected || isPending}
                  className="h-8 w-8 rounded-lg hover:bg-red-500/10 hover:text-red-600 transition-colors disabled:opacity-30"
                >
                  <X className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
            </TooltipTrigger>
            <TooltipContent className="bg-popover text-popover-foreground border-border/50 font-sans text-xs">
              Reject Application
            </TooltipContent>
          </Tooltip>
          <AlertDialogContent className="rounded-2xl border-border/50 max-w-md">
            <AlertDialogHeader>
              <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-600 mb-2">
                <AlertCircle className="h-6 w-6" />
              </div>
              <AlertDialogTitle className="font-serif text-xl">Reject Application?</AlertDialogTitle>
              <AlertDialogDescription className="font-sans">
                Are you sure you want to reject <span className="font-bold text-foreground">{orgName}</span>?
                This will notify the applicant and they will be able to see any feedback provided below.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4 space-y-2">
              <label className="text-xs font-sans font-bold text-foreground/50 uppercase tracking-widest">Optional Rejection Note</label>
              <Textarea
                placeholder="Reason for rejection (e.g., identity verification failed, slug unavailable...)"
                className="font-sans rounded-xl border-border/50 focus:ring-red-500/20 focus:border-red-500 min-h-[100px]"
                value={rejectionNote}
                onChange={(e) => setRejectionNote(e.target.value)}
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl font-sans" onClick={() => setRejectionNote("")}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={isPending}
                onClick={() => handleAction("reject")}
                className="bg-red-600 hover:bg-red-700 text-white rounded-xl font-sans flex items-center gap-2"
              >
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Confirm Rejection
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Action with Confirmation */}
        <AlertDialog>
          <Tooltip>
            <TooltipTrigger asChild>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={isPending}
                  className="h-8 w-8 rounded-lg hover:bg-red-500/10 hover:text-red-600 transition-colors disabled:opacity-30"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
            </TooltipTrigger>
            <TooltipContent className="bg-popover text-popover-foreground border-border/50 font-sans text-xs">
              Delete Forever
            </TooltipContent>
          </Tooltip>
          <AlertDialogContent className="rounded-2xl border-border/50">
            <AlertDialogHeader>
              <AlertDialogTitle className="font-serif">Delete Permanently?</AlertDialogTitle>
              <AlertDialogDescription className="font-sans">
                This will completely remove <span className="font-bold text-foreground">{orgName}</span> from the database.
                This action is irreversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl font-sans">Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={isPending}
                onClick={() => handleAction("delete")}
                className="bg-red-600 hover:bg-red-700 text-white rounded-xl font-sans flex items-center gap-2"
              >
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Confirm Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
