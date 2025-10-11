"use client";

import { useState, useEffect } from "react";
import { FileText, Plus } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/custom/data-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreateTemplateDialog } from "@/components/admin/templates/create-template-dialog";
import { EditTemplateDialog } from "@/components/admin/templates/edit-template-dialog";
import { DeleteTemplateDialog } from "@/components/admin/templates/delete-template-dialog";
import { Template } from "@/constants/templates";
import { useTenant } from "@/contexts/tenant-context";
import { getTemplatesAction } from "@/app/actions/templates";

const columns: ColumnDef<Template>[] = [
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => (
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
          <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
        </div>
        <div className="font-semibold text-foreground text-sm sm:text-base min-w-0">
          <div className="truncate">{row.getValue("title")}</div>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => {
      const description = row.getValue("description") as string;
      const truncatedDescription = description.length > 50 
        ? `${description.substring(0, 50)}...` 
        : description;
      
      return (
        <div className="text-muted-foreground text-xs sm:text-sm leading-relaxed max-w-xs sm:max-w-md">
          {truncatedDescription}
        </div>
      );
    },
  },
  {
    accessorKey: "created_at",
    header: "Created",
    cell: ({ row }) => {
      const date = new Date(row.original.created_at || "");
      return (
        <div className="text-muted-foreground text-xs sm:text-sm whitespace-nowrap">
          {date.toLocaleDateString()}
        </div>
      );
    },
  },
  {
    accessorKey: "fields",
    header: "Fields",
    cell: ({ row }) => (
      <div className="text-muted-foreground text-xs sm:text-sm text-center">
        {row.original.fields.length}
      </div>
    ),
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <EditTemplateDialog 
          template={row.original} 
          onTemplateUpdated={() => window.location.reload()} 
        />
        <DeleteTemplateDialog 
          template={row.original} 
          onTemplateDeleted={() => window.location.reload()} 
        />
      </div>
    ),
  },
];

export default function AdminTemplatesPage() {
  const { tenantId, isLoading: tenantLoading } = useTenant();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize] = useState(10);
  const [sorting, setSorting] = useState([]);
  const [filter, setFilter] = useState("");

  const loadTemplates = async () => {
    if (!tenantId || tenantLoading) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await getTemplatesAction(tenantId);
      if (result.success && result.data) {
        setTemplates(result.data);
      } else {
        console.error("Failed to load templates:", result.message);
        setTemplates([]);
      }
    } catch (error) {
      console.error("Error loading templates:", error);
      setTemplates([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, [tenantId, tenantLoading]);

  const filteredTemplates = templates.filter(
    (template) =>
      template.title.toLowerCase().includes(filter.toLowerCase()) ||
      template.description.toLowerCase().includes(filter.toLowerCase())
  );

  const pageCount = Math.ceil(filteredTemplates.length / pageSize);
  const paginatedTemplates = filteredTemplates.slice(
    pageIndex * pageSize,
    (pageIndex + 1) * pageSize
  );

  const handlePageChange = (newPageIndex: number) => {
    setPageIndex(newPageIndex);
  };

  const handleSortChange = (updater: any) => {
    setSorting(updater);
  };

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    setPageIndex(0);
  };

  const handleRefresh = async () => {
    setFilter("");
    setPageIndex(0);
    setSorting([]);
    await loadTemplates();
  };

  if (tenantLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-primary mx-auto mb-3 sm:mb-4"></div>
          <p className="text-muted-foreground text-sm sm:text-base">Loading templates...</p>
        </div>
      </div>
    );
  }

  if (!tenantId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-muted-foreground text-sm sm:text-base">
            No tenant selected. Please select a tenant to manage templates.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold tracking-tight text-foreground mb-3 sm:mb-4">
              Template Management
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
              Create, edit, and manage document templates for your organization
            </p>
          </div>
        </div>

        {/* Data Table */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-lg sm:text-xl lg:text-2xl font-semibold">
                  Templates
                </CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Manage your organization's document templates
                </CardDescription>
              </div>
              <CreateTemplateDialog onTemplateCreated={handleRefresh} />
            </div>
          </CardHeader>
          <CardContent className="px-2 sm:px-4 lg:px-6">
            <div className="overflow-x-auto">
              <DataTable
                columns={columns}
                data={paginatedTemplates}
                pageCount={pageCount}
                onPageChange={handlePageChange}
                onSortChange={handleSortChange}
                onFilterChange={handleFilterChange}
                onRefresh={handleRefresh}
                isLoading={isLoading}
                pageIndex={pageIndex}
                pageSize={pageSize}
                sorting={sorting}
                searchPlaceholder="Search templates..."
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
