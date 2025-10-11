"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TenantBadge } from "./tenant-badge";
import { cn } from "@/lib/utils";

interface TenantCardProps {
  name: string;
  description?: string;
  role?: string;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
}

export function TenantCard({
  name,
  description,
  role,
  isSelected = false,
  onClick,
  className,
}: TenantCardProps) {
  return (
    <Card
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-md",
        isSelected && "ring-2 ring-primary",
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{name}</CardTitle>
          {role && <TenantBadge name={role} variant="outline" />}
        </div>
        {description && (
          <CardDescription>{description}</CardDescription>
        )}
      </CardHeader>
      {isSelected && (
        <CardContent className="pt-0">
          <TenantBadge name="Current Tenant" variant="default" />
        </CardContent>
      )}
    </Card>
  );
}
