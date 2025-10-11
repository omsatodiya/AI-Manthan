"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/custom/data-table";
import { templates } from "@/constants/templates";
import { Template } from "@/constants/templates";
import { ColumnDef } from "@tanstack/react-table";

const columns: ColumnDef<Template>[] = [
  {
    accessorKey: "title",
    header: "Template Name",
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("title")}</div>
    ),
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => (
      <div className="text-muted-foreground max-w-md">
        {row.getValue("description")}
      </div>
    ),
  },
  {
    accessorKey: "fields",
    header: "Fields",
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground">
        {row.original.fields.length} fields
      </div>
    ),
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <Link href={`/templates/${row.original.id}`}>
        <Button variant="outline" size="sm">
          <ExternalLink className="mr-2 h-4 w-4" />
          Use Template
        </Button>
      </Link>
    ),
  },
];

export default function TemplateSelectionPage() {
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize] = useState(10);
  const [sorting, setSorting] = useState([]);
  const [filter, setFilter] = useState("");

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

  const handleRefresh = () => {
    setFilter("");
    setPageIndex(0);
    setSorting([]);
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-7xl mx-auto">
        <header className="mb-8">
          <div className="mb-6">
            <Link href="/">
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Document Templates
          </h1>
          <p className="mt-1 text-muted-foreground">
            Choose from our collection of professional document templates.
          </p>
        </header>

        <DataTable
          columns={columns}
          data={paginatedTemplates}
          pageCount={pageCount}
          onPageChange={handlePageChange}
          onSortChange={handleSortChange}
          onFilterChange={handleFilterChange}
          onRefresh={handleRefresh}
          isLoading={false}
          pageIndex={pageIndex}
          pageSize={pageSize}
          sorting={sorting}
          searchPlaceholder="Search by Template Name..."
        />
      </div>
    </div>
  );
}
