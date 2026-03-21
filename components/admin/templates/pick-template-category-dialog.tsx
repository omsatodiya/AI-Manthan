"use client";

import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TEMPLATE_CATEGORIES } from "@/constants/templates/categories";

const CREATE_CATEGORIES = TEMPLATE_CATEGORIES.filter((c) => c.id !== "general");

interface PickTemplateCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PickTemplateCategoryDialog({
  open,
  onOpenChange,
}: PickTemplateCategoryDialogProps) {
  const router = useRouter();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-sans">Choose category</DialogTitle>
          <DialogDescription className="font-sans">
            Select where this template belongs. You will pick a starter layout next.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2 sm:gap-3 pt-2">
          {CREATE_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <Button
                key={cat.id}
                variant="outline"
                className="h-auto justify-start gap-3 py-4 px-4 text-left whitespace-normal"
                onClick={() => {
                  onOpenChange(false);
                  router.push(`/admin/templates/create/${cat.id}`);
                }}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-sm sm:text-base">
                    {cat.label}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground font-normal leading-snug">
                    {cat.shortDescription}
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
