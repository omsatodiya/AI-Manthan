"use client";

import React from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, UserX, AlertTriangle } from "lucide-react";
import { TenantMember } from "@/lib/types/tenant";

interface RemoveMemberDialogProps {
  member: TenantMember | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  isProcessing: boolean;
}

export function RemoveMemberDialog({ 
  member, 
  isOpen, 
  onOpenChange, 
  onConfirm, 
  isProcessing 
}: RemoveMemberDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
        <div className="bg-red-600 p-8 text-white relative overflow-hidden">
          <UserX className="absolute -bottom-4 -right-4 h-32 w-32 opacity-10" />
          <DialogHeader className="relative">
            <DialogTitle className="text-2xl font-serif text-white">Remove Member</DialogTitle>
            <DialogDescription className="text-red-100 mt-1">
              Are you absolutely sure you want to remove this member?
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="p-8 space-y-4">
          <div className="flex gap-4 p-4 bg-red-50 rounded-2xl border border-red-100 text-red-800">
            <AlertTriangle className="h-6 w-6 shrink-0" />
            <p className="text-sm leading-relaxed">
              Removing <strong>{member?.user?.fullName}</strong> will immediately revoke all access to this community. This action cannot be undone.
            </p>
          </div>
        </div>
        <DialogFooter className="p-8 pt-0 flex sm:justify-between gap-3">
          <Button variant="ghost" className="rounded-xl h-12 px-6" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            variant="destructive"
            className="rounded-xl h-12 px-8 font-sans font-bold flex-1 sm:flex-none" 
            onClick={onConfirm}
            disabled={isProcessing}
          >
            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Confirm Removal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
