"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Package } from "lucide-react";
import { DataTable } from "@/components/admin/data-table";
import { useCustomerDetail } from "@/contexts/customer-detail-context";
import { useCustomerOrdersQuery } from "@/hooks/admin/customers/use-customer-orders-query";
import { type CustomerOrder } from "@/lib/api/admin/customers";
import { useSession } from "next-auth/react";

interface CustomerOrdersProps {
  isOverview?: boolean;
}

interface OrderRow {
  original: CustomerOrder;
}

interface CellContext {
  row: OrderRow;
}

interface Column {
  header: string;
  accessorKey?: string;
  cell?: (context: CellContext) => React.ReactNode;
}

const getStatusBadge = (status: string) => {
  switch (status.toLowerCase()) {
    case "delivered":
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          Delivered
        </Badge>
      );
    case "shipped":
      return (
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
          Shipped
        </Badge>
      );
    case "processing":
      return (
        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
          Processing
        </Badge>
      );
    case "cancelled":
      return <Badge variant="destructive">Cancelled</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

const columns: Column[] = [
  {
    header: "Order",
    accessorKey: "orderNumber",
    cell: ({ row }: CellContext) => (
      <Link
        href={`/admin/orders/${row.original.id}`}
        className="font-medium hover:underline"
      >
        {row.original.orderNumber}
      </Link>
    ),
  },
  {
    header: "Date",
    accessorKey: "createdAt",
    cell: ({ row }: CellContext) =>
      new Date(row.original.createdAt).toLocaleDateString(),
  },
  {
    header: "Status",
    accessorKey: "status",
    cell: ({ row }: CellContext) => getStatusBadge(row.original.status),
  },
  {
    header: "Items",
    accessorKey: "itemCount",
  },
  {
    header: "Total",
    accessorKey: "totalAmount",
    cell: ({ row }: CellContext) => (
      <div className="font-medium">
        ${(row.original.totalAmount / 100).toFixed(2)}
      </div>
    ),
  },
  {
    header: "Actions",
    cell: ({ row }: CellContext) => (
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/admin/orders/${row.original.id}`}>
          <Eye className="mr-1 h-3 w-3" />
          View
        </Link>
      </Button>
    ),
  },
];

export function CustomerOrders({ isOverview = false }: CustomerOrdersProps) {
  const { customerId } = useCustomerDetail();
  const session = useSession();
  const storeId = session.data?.store?.id ?? "";

  const { data, isLoading, error } = useCustomerOrdersQuery({
    customerId,
    storeId,
    page: isOverview ? 1 : undefined,
    limit: isOverview ? 5 : undefined,
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order History
            </CardTitle>
            <CardDescription>
              {isOverview ? "Recent orders" : "All customer orders"}
            </CardDescription>
          </div>
          {isOverview && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/admin/customers/${customerId}?tab=orders`}>
                View All
              </Link>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <p className="text-muted-foreground text-sm">Loading orders...</p>
          </div>
        ) : error ? (
          <div className="flex h-32 items-center justify-center">
            <p className="text-destructive text-sm">Failed to load orders</p>
          </div>
        ) : !data?.orders.length ? (
          <div className="flex h-32 items-center justify-center">
            <p className="text-muted-foreground text-sm">No orders found</p>
          </div>
        ) : (
          <DataTable columns={columns} data={data.orders} />
        )}
      </CardContent>
    </Card>
  );
}
