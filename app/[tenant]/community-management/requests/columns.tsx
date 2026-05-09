"use client";

import { ColumnDef } from "@tanstack/react-table";
import { TenantMember } from "@/lib/types/tenant";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  UserCheck, 
  UserX, 
  MoreHorizontal,
  Trash2,
  Clock
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";

export const getRequestColumns = (
  onAccept: (member: TenantMember) => void,
  onReject: (member: TenantMember) => void,
  onDelete: (member: TenantMember) => void
): ColumnDef<TenantMember>[] => [
  {
    accessorKey: "user",
    header: "Applicant",
    cell: ({ row }) => {
      const member = row.original;
      const user = member.user;
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 border border-border/50">
            <AvatarFallback className="bg-secondary text-primary text-xs font-bold">
              {user?.fullName?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium text-sm">{user?.fullName}</span>
            <span className="text-xs text-muted-foreground truncate max-w-[150px]">{user?.email}</span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: () => {
      return (
        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-200">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </Badge>
      );
    },
  },
  {
    accessorKey: "joinedAt",
    header: "Applied On",
    cell: ({ row }) => {
      const date = row.getValue("joinedAt") as string;
      return (
        <span className="text-sm text-muted-foreground font-sans">
          {date ? format(new Date(date), "MMM d, yyyy") : "N/A"}
        </span>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const member = row.original;

      return (
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-8 text-primary hover:text-primary hover:bg-primary/5 font-bold"
            onClick={() => onAccept(member)}
          >
            <UserCheck className="h-4 w-4 mr-1.5" />
            Accept
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-secondary rounded-lg">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px] rounded-xl shadow-xl border-border/50">
              <DropdownMenuLabel className="font-serif text-xs font-bold uppercase tracking-widest text-muted-foreground px-3 py-2">
                Decide
              </DropdownMenuLabel>
              <DropdownMenuItem 
                onClick={() => onReject(member)} 
                className="cursor-pointer gap-2 rounded-lg m-1 text-red-600 focus:text-red-600 focus:bg-red-50"
              >
                <UserX className="w-4 h-4" />
                <span>Reject Request</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="opacity-50" />
              <DropdownMenuItem 
                onClick={() => onDelete(member)} 
                className="cursor-pointer gap-2 rounded-lg m-1 opacity-70 hover:opacity-100"
              >
                <Trash2 className="w-4 h-4" />
                <span>Permanent Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
