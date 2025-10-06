"use client";
import { DataTable } from "@/components/admin/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, MapPin } from "lucide-react";
import Link from "next/link";
import { useCustomersQuery } from "@/hooks/admin/customers/use-customers-query";
import { useSession } from "next-auth/react";
import { type CustomerListItem } from "@/lib/api/admin/customers";

interface TableRow {
  original: CustomerListItem;
}

interface CellContext {
  row: TableRow;
}

const columns = [
  {
    header: "Customer",
    accessorKey: "name",
    cell: ({ row }: CellContext) => {
      const customer = row.original;
      return (
        <div>
          <div className="font-medium">{customer.name}</div>
          <div className="text-muted-foreground text-sm">{customer.email}</div>
        </div>
      );
    },
  },
  {
    header: "Location",
    accessorKey: "location",
    cell: ({ row }: CellContext) => {
      const customer = row.original;
      return customer.location ? (
        <div className="flex items-center gap-1 text-sm">
          <MapPin className="text-muted-foreground h-3 w-3" />
          <span>{customer.location}</span>
        </div>
      ) : (
        <span className="text-muted-foreground text-sm">—</span>
      );
    },
  },
  {
    header: "Status",
    accessorKey: "status",
    cell: ({ row }: CellContext) => {
      const customer = row.original;
      return (
        <Badge variant={customer.status === "Active" ? "default" : "secondary"}>
          {customer.status}
        </Badge>
      );
    },
  },
  {
    header: "Total Orders",
    accessorKey: "totalOrders",
    cell: ({ row }: CellContext) => {
      const customer = row.original;
      return <div className="text-center">{customer.totalOrders}</div>;
    },
  },
  {
    header: "Total Spent",
    accessorKey: "totalSpent",
    cell: ({ row }: CellContext) => {
      const customer = row.original;
      return (
        <div className="font-medium">
          ${(customer.totalSpent / 100).toFixed(2)}
        </div>
      );
    },
  },
  {
    header: "Join Date",
    accessorKey: "joinDate",
    cell: ({ row }: CellContext) => {
      const customer = row.original;
      return (
        <div className="text-sm">
          {new Date(customer.joinDate).toLocaleDateString()}
        </div>
      );
    },
  },
  {
    header: "Actions",
    cell: ({ row }: CellContext) => {
      const customer = row.original;
      return (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/admin/customers/${customer.id}`}>View</Link>
          </Button>
        </div>
      );
    },
  },
];

export default function CustomersPage() {
  const session = useSession();
  const storeId = session?.data?.store?.id ?? "";
  console.log("Store ID", storeId);
  const { data, isLoading } = useCustomersQuery({
    storeId,
    page: 1,
    limit: 10,
    search: undefined,
    sortBy: "joinDate",
    sortOrder: "desc",
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Customer Management</h1>
        <p className="text-muted-foreground">
          View and manage customers who have purchased from your store
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Customers</CardTitle>
          <CardDescription>
            Customers who have placed orders in your store
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex items-center gap-4">
            <div className="relative max-w-sm flex-1">
              <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
              <Input placeholder="Search customers..." className="pl-8" />
            </div>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Loading customers...</p>
            </div>
          ) : (
            <DataTable columns={columns} data={data?.customers ?? []} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
