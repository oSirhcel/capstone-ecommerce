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
import { DataTable } from "@/components/admin/customers/data-table";

interface CustomerOrdersProps {
  customerId: string;
  isOverview?: boolean;
}

// Mock orders data
const orders = [
  {
    id: "ORD-1234",
    date: "2024-01-10",
    status: "delivered",
    total: "$89.99",
    items: 3,
    paymentStatus: "paid",
  },
  {
    id: "ORD-1235",
    date: "2024-01-05",
    status: "shipped",
    total: "$156.50",
    items: 2,
    paymentStatus: "paid",
  },
  {
    id: "ORD-1236",
    date: "2023-12-28",
    status: "delivered",
    total: "$45.00",
    items: 1,
    paymentStatus: "paid",
  },
  {
    id: "ORD-1237",
    date: "2023-12-15",
    status: "delivered",
    total: "$234.99",
    items: 5,
    paymentStatus: "paid",
  },
  {
    id: "ORD-1238",
    date: "2023-12-01",
    status: "delivered",
    total: "$67.50",
    items: 2,
    paymentStatus: "paid",
  },
];

const getStatusBadge = (status: string) => {
  switch (status) {
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

const columns = [
  {
    header: "Order",
    accessorKey: "id",
    cell: ({ row }: any) => (
      <Link
        href={`/admin/orders/${row.original.id}`}
        className="font-medium hover:underline"
      >
        {row.original.id}
      </Link>
    ),
  },
  {
    header: "Date",
    accessorKey: "date",
    cell: ({ row }: any) => new Date(row.original.date).toLocaleDateString(),
  },
  {
    header: "Status",
    accessorKey: "status",
    cell: ({ row }: any) => getStatusBadge(row.original.status),
  },
  {
    header: "Items",
    accessorKey: "items",
  },
  {
    header: "Total",
    accessorKey: "total",
    cell: ({ row }: any) => (
      <div className="font-medium">{row.original.total}</div>
    ),
  },
  {
    header: "Actions",
    cell: ({ row }: any) => (
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/admin/orders/${row.original.id}`}>
          <Eye className="mr-1 h-3 w-3" />
          View
        </Link>
      </Button>
    ),
  },
];

export function CustomerOrders({
  customerId,
  isOverview = false,
}: CustomerOrdersProps) {
  const displayOrders = isOverview ? orders.slice(0, 5) : orders;

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
              <Link href={`/admin/users/${customerId}?tab=orders`}>
                View All
              </Link>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <DataTable columns={columns} data={displayOrders} />
      </CardContent>
    </Card>
  );
}
