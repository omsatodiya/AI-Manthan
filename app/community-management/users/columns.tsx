"use client";

import { ColumnDef } from "@tanstack/react-table";
import { TenantMember, TenantRole } from "@/lib/types/tenant";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MoreHorizontal,
  UserMinus,
  Shield,
  User as UserIcon,
  Briefcase,
  Star
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

export const getColumns = (
  onEdit: (member: TenantMember) => void,
  onRemove: (member: TenantMember) => void
): ColumnDef<TenantMember>[] => [
    {
      accessorKey: "user",
      header: "Member",
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
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const role = row.getValue("role") as TenantRole;
        return (
          <Badge
            variant="outline"
            className={
              role === "owner" ? "bg-purple-500/10 text-purple-600 border-purple-200" :
                role === "admin" ? "bg-blue-500/10 text-blue-600 border-blue-200" :
                  role === "employee" ? "bg-amber-500/10 text-amber-600 border-amber-200" :
                    "bg-slate-500/10 text-slate-600 border-slate-200"
            }
          >
            {role === "owner" && <Star className="w-3 h-3 mr-1" />}
            {role === "admin" && <Shield className="w-3 h-3 mr-1" />}
            {role === "employee" && <Briefcase className="w-3 h-3 mr-1" />}
            {role === "member" && <UserIcon className="w-3 h-3 mr-1" />}
            <span className="capitalize">{role}</span>
          </Badge>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <Badge
            variant={status === "active" ? "secondary" : "outline"}
            className={status === "active" ? "bg-chart-2/10 text-chart-2 hover:bg-chart-2/10 border-none" : ""}
          >
            <span className="capitalize">{status}</span>
          </Badge>
        );
      },
    },
    {
      accessorKey: "joinedAt",
      header: "Joined",
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-secondary rounded-lg">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px] rounded-xl shadow-xl border-border/50">
              <DropdownMenuLabel className="font-serif text-xs font-bold uppercase tracking-widest text-muted-foreground px-3 py-2">
                Management
              </DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onEdit(member)} className="cursor-pointer gap-2 rounded-lg m-1">
                <Shield className="w-4 h-4 text-blue-600" />
                <span>Modify Role</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="opacity-50" />
              <DropdownMenuItem
                onClick={() => onRemove(member)}
                className="cursor-pointer gap-2 rounded-lg m-1 text-red-600 focus:text-red-600 focus:bg-red-50"
              >
                <UserMinus className="w-4 h-4" />
                <span>Remove Member</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
