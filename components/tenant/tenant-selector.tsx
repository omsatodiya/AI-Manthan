"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TenantBadge } from "./tenant-badge";
import { cn } from "@/lib/utils";

interface TenantSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  tenants: Array<{ id: string; name: string; role: string }>;
  placeholder?: string;
  className?: string;
  showCurrentBadge?: boolean;
  currentTenantName?: string;
}

export function TenantSelector({
  value,
  onValueChange,
  tenants,
  placeholder = "Select a tenant",
  className,
  showCurrentBadge = true,
  currentTenantName,
}: TenantSelectorProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-full max-w-md">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {tenants.map((tenant) => (
            <SelectItem key={tenant.id} value={tenant.id}>
              <div className="flex items-center gap-2">
                <span>{tenant.name}</span>
                <TenantBadge name={tenant.role} variant="outline" />
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {showCurrentBadge && value && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Current:</span>
          <TenantBadge 
            name={currentTenantName || tenants.find(t => t.id === value)?.name || value} 
            variant="secondary" 
          />
        </div>
      )}
    </div>
  );
}
