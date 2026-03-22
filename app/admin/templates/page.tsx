"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { SortingState } from "@tanstack/react-table";
import {
  FileText,
  Plus,
  ArrowLeft,
  Loader2,
  Eye,
  Pencil,
  Trash2,
  ListFilter,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DataTable } from "@/components/custom/data-table";
import { PickTemplateCategoryDialog } from "@/components/admin/templates/pick-template-category-dialog";
import { EditTemplateDialog } from "@/components/admin/templates/edit-template-dialog";
import { DeleteTemplateDialog } from "@/components/admin/templates/delete-template-dialog";
import { TemplatePreviewDialog } from "@/components/admin/templates/template-preview-dialog";
import { Template } from "@/constants/templates";
import {
  getCategoryMeta,
  TEMPLATE_CATEGORIES,
  type TemplateCategoryId,
} from "@/constants/templates/categories";
import { cn } from "@/lib/utils";
import { useTenant } from "@/contexts/tenant-context";
import { getTemplatesAction } from "@/app/actions/templates";
import { ColumnDef } from "@tanstack/react-table";
import {
  invalidateTemplatesCache,
  writeTemplatesCache,
} from "@/lib/templates-client-cache";

type CategoryFilter = "all" | TemplateCategoryId;

export default function AdminTemplatesPage() {
  const router = useRouter();
  const { tenantId, isLoading: tenantLoading } = useTenant();
  const [allTemplates, setAllTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [filter, setFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [filterPopoverOpen, setFilterPopoverOpen] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const pageSize = 10;

  const [refreshCounter, setRefreshCounter] = useState(0);
  const handleRefresh = () => {
    if (tenantId) invalidateTemplatesCache(tenantId);
    setRefreshCounter((prev) => prev + 1);
  };

  const [prevFilter, setPrevFilter] = useState("");
  useEffect(() => {
    if (filter !== prevFilter) {
      setPageIndex(0);
      setPrevFilter(filter);
    }
  }, [filter, prevFilter]);

  useEffect(() => {
    setPageIndex(0);
  }, [categoryFilter]);

  const [pickCategoryOpen, setPickCategoryOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [editTemplate, setEditTemplate] = useState<Template | null>(null);
  const [deleteTemplate, setDeleteTemplate] = useState<Template | null>(null);

  const data = useMemo(() => {
    let list = allTemplates;
    if (categoryFilter !== "all") {
      list = list.filter(
        (t) => (t.category ?? "general") === categoryFilter
      );
    }
    const q = filter.toLowerCase();
    list = list.filter(
      (template) =>
        template.title.toLowerCase().includes(q) ||
        (template.description ?? "").toLowerCase().includes(q)
    );
    return {
      templates: list,
      pageCount: Math.ceil(list.length / pageSize),
    };
  }, [allTemplates, filter, pageSize, categoryFilter]);

  useEffect(() => {
    if (tenantLoading) return;
    let cancelled = false;
    setIsLoading(true);
    getTemplatesAction(tenantId ?? undefined).then((result) => {
      if (cancelled) return;
      if (result.success && result.data) {
        setAllTemplates(result.data);
        if (tenantId) writeTemplatesCache(tenantId, result.data);
      } else {
        setAllTemplates([]);
      }
      setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [tenantId, tenantLoading, refreshCounter]);

  const columns = useMemo(
    () =>
      [
        {
          accessorKey: "title",
          header: "Title",
          cell: ({ row }: { row: { getValue: (key: string) => string } }) => (
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
          cell: ({ row }: { row: { getValue: (key: string) => string } }) => {
            const description = (row.getValue("description") as string) ?? "";
            const truncatedDescription =
              description.length > 50
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
          accessorKey: "category",
          header: "Category",
          cell: ({ row }: { row: { original: Template } }) => {
            const cat = row.original.category ?? "general";
            const label = getCategoryMeta(cat)?.label ?? cat;
            return (
              <span className="text-muted-foreground text-xs sm:text-sm whitespace-nowrap">
                {label}
              </span>
            );
          },
        },
        {
          accessorKey: "created_at",
          header: "Created",
          cell: ({ row }: { row: { original: { created_at?: string } } }) => {
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
          cell: ({ row }: { row: { original: { fields?: unknown[] } } }) => (
            <div className="text-muted-foreground text-xs sm:text-sm text-center">
              {Array.isArray(row.original.fields)
                ? row.original.fields.length
                : 0}
            </div>
          ),
        },
        {
          id: "actions",
          header: () => (
            <div className="w-full text-center font-medium">Actions</div>
          ),
          cell: ({ row }: { row: { original: Template } }) => {
            const t = row.original;
            return (
              <div className="flex items-center justify-center gap-0.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  aria-label="Preview template"
                  onClick={() => setPreviewTemplate(t)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  aria-label="Edit template"
                  onClick={() => setEditTemplate(t)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  aria-label="Delete template"
                  onClick={() => setDeleteTemplate(t)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          },
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

        {isLoading && allTemplates.length === 0 ? (
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
            searchPlaceholder="Search by title..."
            toolbarExtra={
              <Popover
                open={filterPopoverOpen}
                onOpenChange={setFilterPopoverOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Filter by category"
                    className={cn(
                      categoryFilter !== "all" &&
                        "border-primary text-primary"
                    )}
                  >
                    <ListFilter className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-2" align="start">
                  <div className="space-y-1">
                    <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                      Category
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setCategoryFilter("all");
                        setFilterPopoverOpen(false);
                      }}
                      className={cn(
                        "flex w-full rounded-md px-2 py-2 text-left text-sm hover:bg-muted",
                        categoryFilter === "all" && "bg-muted font-medium"
                      )}
                    >
                      All categories
                    </button>
                    {TEMPLATE_CATEGORIES.map((cat) => {
                      const Icon = cat.icon;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            setCategoryFilter(cat.id);
                            setFilterPopoverOpen(false);
                          }}
                          className={cn(
                            "flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-muted",
                            categoryFilter === cat.id && "bg-muted font-medium"
                          )}
                        >
                          <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <span className="min-w-0">{cat.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>
            }
          >
            <Button onClick={() => setPickCategoryOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Template
            </Button>
          </DataTable>
        )}
      </div>

      <PickTemplateCategoryDialog
        open={pickCategoryOpen}
        onOpenChange={setPickCategoryOpen}
      />
      <TemplatePreviewDialog
        template={previewTemplate}
        open={previewTemplate !== null}
        onOpenChange={(open) => {
          if (!open) setPreviewTemplate(null);
        }}
      />
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
