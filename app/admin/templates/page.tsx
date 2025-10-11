"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { SortingState } from "@tanstack/react-table";
import { FileText, Plus, ArrowLeft, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/custom/data-table";
import { CreateTemplateDialog } from "@/components/admin/templates/create-template-dialog";
import { EditTemplateDialog } from "@/components/admin/templates/edit-template-dialog";
import { DeleteTemplateDialog } from "@/components/admin/templates/delete-template-dialog";
import { Template } from "@/constants/templates";
import { useTenant } from "@/contexts/tenant-context";
import { getTemplatesAction } from "@/app/actions/templates";
import { ColumnDef } from "@tanstack/react-table";


export default function AdminTemplatesPage() {
  const router = useRouter();
  const { tenantId, isLoading: tenantLoading } = useTenant();
  const [data, setData] = useState<{ templates: Template[]; pageCount: number }>({
    templates: [],
    pageCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [filter, setFilter] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const pageSize = 10;

  const [refreshCounter, setRefreshCounter] = useState(0);
  const handleRefresh = () => setRefreshCounter((prev) => prev + 1);

  const [prevFilter, setPrevFilter] = useState("");
  useEffect(() => {
    if (filter !== prevFilter) {
      setPageIndex(0);
      setPrevFilter(filter);
    }
  }, [filter, prevFilter]);

  const [createTemplateOpen, setCreateTemplateOpen] = useState(false);
  const [editTemplate, setEditTemplate] = useState<Template | null>(null);
  const [deleteTemplate, setDeleteTemplate] = useState<Template | null>(null);

  useEffect(() => {
    if (!tenantId || tenantLoading) {
      return;
    }

    setIsLoading(true);
    getTemplatesAction(tenantId).then((result) => {
      if (result.success && result.data) {
        const filteredTemplates = result.data.filter(
          (template) =>
            template.title.toLowerCase().includes(filter.toLowerCase()) ||
            template.description.toLowerCase().includes(filter.toLowerCase())
        );
        const pageCount = Math.ceil(filteredTemplates.length / pageSize);
        setData({ templates: filteredTemplates, pageCount });
      } else {
        console.error("Failed to load templates:", result.message);
        setData({ templates: [], pageCount: 0 });
      }
      setIsLoading(false);
    });
  }, [tenantId, tenantLoading, filter, refreshCounter]);

  const columns = useMemo(
    () => [
      {
        accessorKey: "title",
        header: "Title",
        cell: ({ row }: { row: any }) => (
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
        cell: ({ row }: { row: any }) => {
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
        cell: ({ row }: { row: any }) => {
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
        cell: ({ row }: { row: any }) => (
          <div className="text-muted-foreground text-xs sm:text-sm text-center">
            {row.original.fields.length}
          </div>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }: { row: any }) => (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditTemplate(row.original)}
            >
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteTemplate(row.original)}
              className="text-destructive hover:text-destructive"
            >
              Delete
            </Button>
          </div>
        ),
      },
    ] as ColumnDef<Template>[],
    []
  );

  return (
    <main className="min-h-screen bg-secondary p-4 sm:p-6 md:p-8 dark:bg-background">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold font-serif">Template Management</h1>
        </div>

        {isLoading && !data.templates.length ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={data.templates}
            pageCount={data.pageCount}
            onPageChange={setPageIndex}
            onSortChange={setSorting}
            onFilterChange={setFilter}
            onRefresh={handleRefresh}
            isLoading={isLoading}
            pageIndex={pageIndex}
            pageSize={pageSize}
            sorting={sorting}
            searchPlaceholder="Search by title...">
            <Button onClick={() => setCreateTemplateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Template
            </Button>
          </DataTable>
        )}
      </div>

      {createTemplateOpen && (
        <CreateTemplateDialog
          open={createTemplateOpen}
          onOpenChange={setCreateTemplateOpen}
          onTemplateCreated={handleRefresh}
        />
      )}
      {editTemplate && (
        <EditTemplateDialog 
          template={editTemplate} 
          onTemplateUpdated={handleRefresh}
          onOpenChange={() => setEditTemplate(null)} 
        />
      )}
      {deleteTemplate && (
        <DeleteTemplateDialog
          template={deleteTemplate}
          onTemplateDeleted={handleRefresh}
          onOpenChange={() => setDeleteTemplate(null)}
        />
      )}
    </main>
  );
}
