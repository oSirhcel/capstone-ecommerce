import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

export interface DataTableColumn<T = unknown> {
  header: string;
  accessorKey?: string;
  cell?: (props: { row: { original: T } }) => React.ReactNode;
  sortable?: boolean;
  skeleton?: () => React.ReactNode;
}

interface DataTableProps<T = unknown> {
  columns: DataTableColumn<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  onRowClick?: (row: T) => void;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  onSort?: (column: string) => void;
}

export function DataTable<T = unknown>({
  columns,
  data,
  isLoading,
  emptyMessage = "No results found.",
  emptyIcon,
  onRowClick,
  sortBy,
  sortOrder,
  onSort,
}: DataTableProps<T>) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column, index) => (
              <TableHead key={index}>
                {column.sortable && column.accessorKey && onSort ? (
                  <Button
                    variant="ghost"
                    onClick={() => onSort(column.accessorKey!)}
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                  >
                    <span className="flex items-center gap-1">
                      {column.header}
                      {sortBy === column.accessorKey ? (
                        sortOrder === "asc" ? (
                          <ArrowUp className="h-4 w-4" />
                        ) : (
                          <ArrowDown className="h-4 w-4" />
                        )
                      ) : (
                        <ArrowUpDown className="h-4 w-4" />
                      )}
                    </span>
                  </Button>
                ) : (
                  column.header
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, rowIndex) => (
              <TableRow key={`skeleton-${rowIndex}`}>
                {columns.map((column, colIndex) => (
                  <TableCell key={`skeleton-${rowIndex}-${colIndex}`}>
                    {column.skeleton ? (
                      column.skeleton()
                    ) : (
                      <Skeleton className="h-4 w-full" />
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : data.length ? (
            data.map((row, index) => (
              <TableRow
                key={index}
                onClick={() => onRowClick?.(row)}
                className={onRowClick ? "hover:bg-muted/50 cursor-pointer" : ""}
              >
                {columns.map((column, colIndex) => (
                  <TableCell key={colIndex}>
                    {column.cell
                      ? column.cell({ row: { original: row } })
                      : column.accessorKey
                        ? ((row as Record<string, unknown>)[
                            column.accessorKey
                          ] as React.ReactNode)
                        : null}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-32 text-center">
                <div className="text-muted-foreground flex flex-col items-center justify-center gap-2">
                  {emptyIcon}
                  <p className="text-sm">{emptyMessage}</p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
