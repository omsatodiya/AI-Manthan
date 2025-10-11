"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Paperclip, Loader2 } from "lucide-react";
import { validateFileSize, validateFileType } from "@/lib/utils/file-utils";
import { useToast } from "@/hooks/use-toast";

interface FileUploadButtonProps {
  onFileSelect: (file: File) => Promise<void>;
  disabled?: boolean;
}

export const FileUploadButton = ({
  onFileSelect,
  disabled,
}: FileUploadButtonProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!validateFileType(file.type)) {
      toast({
        title: "Invalid file type",
        description:
          "Please upload an image or document file (PDF, Word, Excel, Text).",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (10MB max)
    if (!validateFileSize(file.size, 10)) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);
      await onFileSelect(file);
    } catch {
      toast({
        title: "Upload failed",
        description: "Failed to upload file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
        disabled={disabled || isUploading}
      />
      <Button
        type="button"
        size="icon"
        variant="ghost"
        onClick={handleClick}
        disabled={disabled || isUploading}
        className="rounded-full"
      >
        {isUploading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Paperclip className="size-4" />
        )}
      </Button>
    </>
  );
};
