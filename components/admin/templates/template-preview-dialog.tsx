"use client";

import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Template } from "@/constants/templates";
import { normalizeLineBreaks, populateTemplate } from "@/lib/template-populate";

interface TemplatePreviewDialogProps {
  template: Template | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TemplatePreviewDialog({
  template,
  open,
  onOpenChange,
}: TemplatePreviewDialogProps) {
  const previewHtml = useMemo(() => {
    if (!template) {
      return "<!DOCTYPE html><html><body></body></html>";
    }
    const html = normalizeLineBreaks(template.htmlContent);
    const placeholderData = template.fields.reduce(
      (acc, f) => {
        const k = (f.key ?? "").trim();
        if (!k) return acc;
        const label = (f.name ?? "").trim() || k;
        acc[k] = `[${label}]`;
        return acc;
      },
      {} as Record<string, string>
    );
    try {
      return populateTemplate(html, placeholderData);
    } catch {
      return html;
    }
  }, [template]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] w-[calc(100vw-2rem)] max-w-5xl flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl">
        <DialogHeader className="shrink-0 space-y-1 border-b px-6 py-4 text-left">
          <DialogTitle className="truncate font-sans text-lg">
            {template?.title ?? "Preview"}
          </DialogTitle>
        </DialogHeader>
        <div className="min-h-0 flex-1 bg-muted/30 px-4 pb-4 pt-2">
          <iframe
            title="Template preview"
            className="h-[min(72vh,640px)] w-full rounded-md border bg-white shadow-sm"
            srcDoc={previewHtml}
            sandbox="allow-same-origin allow-scripts"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
