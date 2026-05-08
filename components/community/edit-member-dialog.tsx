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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck } from "lucide-react";
import { TenantMember, TenantRole } from "@/lib/types/tenant";

interface EditMemberDialogProps {
  member: TenantMember | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (role: TenantRole) => Promise<void>;
  isProcessing: boolean;
}

export function EditMemberDialog({ 
  member, 
  isOpen, 
  onOpenChange, 
  onConfirm, 
  isProcessing 
}: EditMemberDialogProps) {
  const [selectedRole, setSelectedRole] = React.useState<TenantRole>("member");

  React.useEffect(() => {
    if (member) {
      setSelectedRole(member.role);
    }
  }, [member]);

  const handleConfirm = () => {
    onConfirm(selectedRole);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
        <div className="bg-primary p-8 text-primary-foreground relative overflow-hidden">
          <ShieldCheck className="absolute -bottom-4 -right-4 h-32 w-32 opacity-10" />
          <DialogHeader className="relative">
            <DialogTitle className="text-2xl font-serif">Modify Access Level</DialogTitle>
            <DialogDescription className="text-primary-foreground/80 mt-1">
              Update the role for <strong>{member?.user?.fullName}</strong>.
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="p-8 space-y-6">
          <div className="space-y-3">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">
              Choose New Role
            </label>
            <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as TenantRole)}>
              <SelectTrigger className="h-12 rounded-xl border-primary/20 bg-secondary/30">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="employee">Employee</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="owner">Owner</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="bg-secondary/50 p-4 rounded-2xl space-y-2">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Permissions Overview</p>
            <p className="text-sm text-foreground/80 leading-relaxed">
              {selectedRole === "owner" && "Full administrative control, billing access, and ownership rights."}
              {selectedRole === "admin" && "Administrative rights to manage members and community content."}
              {selectedRole === "employee" && "Special access to internal community tools and features."}
              {selectedRole === "member" && "Standard participation access with no administrative rights."}
            </p>
          </div>
        </div>
        <DialogFooter className="p-8 pt-0 flex sm:justify-between gap-3">
          <Button variant="ghost" className="rounded-xl h-12 px-6" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            className="bg-primary hover:bg-chart-2 rounded-xl h-12 px-8 font-sans font-bold flex-1 sm:flex-none" 
            onClick={handleConfirm}
            disabled={isProcessing}
          >
            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
