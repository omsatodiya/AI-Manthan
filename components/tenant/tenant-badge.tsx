"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TenantBadgeProps {
  name: string;
  role?: string;
  variant?: "default" | "secondary" | "destructive" | "outline";
  className?: string;
  showRole?: boolean;
}

export function TenantBadge({
  name,
  role,
  variant = "secondary",
  className,
  showRole = false,
}: TenantBadgeProps) {
  return (
    <Badge variant={variant} className={cn("gap-1", className)}>
      <span>{name}</span>
      {showRole && role && (
        <>
          <span className="text-muted-foreground">•</span>
          <span className="text-xs">{role}</span>
        </>
      )}
    </Badge>
  );
}
