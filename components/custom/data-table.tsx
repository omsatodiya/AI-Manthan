"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  SortingState,
  Updater,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, RefreshCw } from "lucide-react";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pageCount: number;
  onPageChange: (pageIndex: number) => void;
  onSortChange: (updater: Updater<SortingState>) => void;
  onFilterChange: (filter: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
  pageIndex: number;
  pageSize: number;
  sorting: SortingState;
  children?: React.ReactNode;
  searchPlaceholder?: string;
  toolbarExtra?: React.ReactNode;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pageCount,
  onPageChange,
  onSortChange,
  onFilterChange,
  onRefresh,
  isLoading,
  pageIndex,
  pageSize,
  sorting,
  children,
  searchPlaceholder = "Search by name or email...",
  toolbarExtra,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    pageCount,
    onSortingChange: onSortChange,
    state: {
      sorting,
      pagination: {
        pageIndex,
        pageSize,
      },
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-4 p-4 pb-0">
        <div className="flex flex-1 items-center gap-2 min-w-[200px]">
          <Input
            placeholder={searchPlaceholder}
            onChange={(event) => onFilterChange(event.target.value)}
            className="max-w-sm bg-background/50 border-border/50 rounded-xl"
          />
          {toolbarExtra}
        </div>
        
        <div className="flex items-center gap-2">
          {children}
          <Button
            variant="outline"
            size="icon"
            onClick={onRefresh}
            disabled={isLoading}
            className="rounded-xl border-border/50 hover:bg-secondary/50"
          >
            <span className="sr-only">Refresh</span>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 p-4 pt-0">
        <div className="flex-1 text-sm text-muted-foreground hidden sm:block">
          {table.getFilteredRowModel().rows.length} records total
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pageIndex - 1)}
            disabled={pageIndex === 0}
            className="rounded-xl border-border/50"
          >
            Previous
          </Button>
          <div className="bg-secondary/50 px-3 py-1 rounded-lg text-xs font-medium">
            {pageIndex + 1} / {pageCount > 0 ? pageCount : 1}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pageIndex + 1)}
            disabled={pageIndex + 1 >= pageCount}
            className="rounded-xl border-border/50"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
