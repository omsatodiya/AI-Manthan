"use client";

import { useState } from "react";
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
} from "@/components/ui/alert-dialog";
import { deleteTemplateAction } from "@/app/actions/templates";
import { Template } from "@/constants/templates";

interface DeleteTemplateDialogProps {
  template: Template | null;
  onTemplateDeleted: () => void;
  onOpenChange?: (open: boolean) => void;
}

export function DeleteTemplateDialog({ template, onTemplateDeleted, onOpenChange }: DeleteTemplateDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  
  const open = template !== null ? true : false;
  const setOpen = (newOpen: boolean) => {
    if (!newOpen && onOpenChange) {
      onOpenChange(false);
    }
  };

  const handleDelete = async () => {
    if (!template) return;
    
    setIsDeleting(true);
    try {
      const result = await deleteTemplateAction(template.id);

      if (result.success) {
        toast.success("Template deleted successfully");
        setOpen(false);
        onTemplateDeleted();
      } else {
        toast.error(result.message || "Failed to delete template");
      }
    } catch (error) {
      console.error("Error deleting template:", error);
      toast.error("Failed to delete template");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-sans">Delete Template</AlertDialogTitle>
          <AlertDialogDescription className="font-sans">
            Are you sure you want to delete the template &quot;{template?.title}&quot;? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Deleting..." : "Delete Template"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
