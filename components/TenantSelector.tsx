"use client";

import { useEffect, useState } from "react";
import { useTenant } from "@/contexts/TenantContext";
import { getTenantMembersAction } from "@/app/actions/user";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

interface TenantMember {
  id: string;
  user_id: string;
  tenant_id: string;
  role: string;
  created_at: string;
  tenants: {
    id: string;
    name: string;
    slug: string;
    created_at: string;
  } | null;
}

// Type for the raw data from Supabase
interface RawTenantMember {
  id: string;
  user_id: string;
  tenant_id: string;
  role: string;
  created_at: string;
  tenants:
    | {
        id: string;
        name: string;
        slug: string;
        created_at: string;
      }[]
    | null;
}

export function TenantSelector() {
  const {
    tenantId,
    setTenantId,
    isLoading: tenantContextLoading,
  } = useTenant();
  const [tenantMembers, setTenantMembers] = useState<TenantMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTenants() {
      try {
        setLoading(true);
        setError(null);

        const result = await getTenantMembersAction();

        if (!result.success) {
          console.error("Error:", result.error);
          setError(result.error || "Unknown error");
          return;
        }

        // Transform the data to match our interface
        const transformedMembers = (
          (result.tenantMembers as RawTenantMember[]) || []
        ).map((member) => ({
          ...member,
          tenants: Array.isArray(member.tenants)
            ? member.tenants[0] || null
            : member.tenants,
        }));
        setTenantMembers(transformedMembers);

        // Update the tenant context with available tenants
        if (transformedMembers.length > 0) {
          // If no tenant is selected or current tenant is not in the list, select first one
          if (
            !tenantId ||
            !transformedMembers.some((m) => m.tenant_id === tenantId)
          ) {
            setTenantId(transformedMembers[0].tenant_id);
          }
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        setError(
          `Unexpected error: ${
            err instanceof Error ? err.message : "Unknown error"
          }`
        );
      } finally {
        setLoading(false);
      }
    }

    fetchTenants();
  }, [tenantId, setTenantId]);

  const handleTenantChange = (newTenantId: string) => {
    setTenantId(newTenantId);
  };

  if (loading || tenantContextLoading) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-full max-w-md" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>Error Loading Tenants</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (tenantMembers.length === 0) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>No Tenants Available</CardTitle>
            <CardDescription>
              You are not currently part of any tenant organizations.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Select Tenant</CardTitle>
          <CardDescription>
            Choose which tenant you want to work with
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={tenantId || ""} onValueChange={handleTenantChange}>
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="Select a tenant" />
            </SelectTrigger>
            <SelectContent>
              {tenantMembers.map((member) => (
                <SelectItem key={member.tenant_id} value={member.tenant_id}>
                  {member.tenants?.name || `Tenant ${member.tenant_id}`} (
                  {member.role})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {tenantId && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Current:</span>
              <Badge variant="secondary">
                {tenantMembers.find((m) => m.tenant_id === tenantId)?.tenants
                  ?.name || tenantId}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
