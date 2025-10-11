"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useTenantData } from "@/hooks/use-tenant-data";
import { useTenantSelection } from "@/hooks/use-tenant-selection";
import { TenantSelector as TenantSelectorComponent } from "@/components/tenant/tenant-selector";

export function TenantSelector() {
  const { tenantMembers, loading, error } = useTenantData();
  const {
    selectedTenantId,
    setSelectedTenantId,
    availableTenants,
    currentTenant,
    isLoading,
  } = useTenantSelection(tenantMembers, loading, error);

  if (isLoading) {
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

  if (availableTenants.length === 0) {
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
          <TenantSelectorComponent
            value={selectedTenantId || ""}
            onValueChange={setSelectedTenantId}
            tenants={availableTenants}
            currentTenantName={currentTenant?.tenant?.name}
          />
        </CardContent>
      </Card>
    </div>
  );
}