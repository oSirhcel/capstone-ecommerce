"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/admin/data-table";
import { formatOrderNumber } from "@/lib/utils/order-number";
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
import { Search, Plus, Download, RefreshCw, ShoppingCart } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { OrdersStats } from "@/components/admin/orders/orders-stats";
import { useSession } from "next-auth/react";
import { useOrdersQuery } from "@/hooks/admin/orders/use-orders-query";

type OrdersListRow = {
  id: number;
  customer: { name: string; email: string };
  amount: number;
  status: string;
  date: string;
  items: number;
  paymentStatus: string;
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "Completed":
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          Completed
        </Badge>
      );
    case "Processing":
      return (
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
          Processing
        </Badge>
      );
    case "Shipped":
      return (
        <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
          Shipped
        </Badge>
      );
    case "Pending":
      return (
        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
          Pending
        </Badge>
      );
    case "Cancelled":
      return <Badge variant="destructive">Cancelled</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

const getPaymentStatusBadge = (status: string) => {
  switch (status) {
    case "Paid":
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          Paid
        </Badge>
      );
    case "Pending":
      return (
        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
          Pending
        </Badge>
      );
    case "Refunded":
      return (
        <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
          Refunded
        </Badge>
      );
    case "Failed":
      return <Badge variant="destructive">Failed</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

const columns = [
  {
    header: "Order",
    accessorKey: "id",
    cell: ({ row }: { row: { original: OrdersListRow } }) => (
      <div className="font-medium">
        <Link
          href={`/admin/orders/${row.original.id}`}
          className="hover:underline"
        >
          {formatOrderNumber(row.original.id)}
        </Link>
        <div className="text-muted-foreground mt-1 text-xs">
          {new Date(row.original.date).toLocaleDateString()}
        </div>
      </div>
    ),
  },
  {
    header: "Customer",
    accessorKey: "customer",
    cell: ({ row }: { row: { original: OrdersListRow } }) => (
      <div className="flex items-center gap-3">
        <div className="min-w-0">
          <div className="truncate font-medium">
            {row.original.customer.name}
          </div>
          <div className="text-muted-foreground truncate text-sm">
            {row.original.customer.email}
          </div>
        </div>
      </div>
    ),
  },
  {
    header: "Amount",
    accessorKey: "amount",
    cell: ({ row }: { row: { original: OrdersListRow } }) => (
      <div className="text-left">
        <div className="font-medium">${row.original.amount.toFixed(2)}</div>
        <div className="text-muted-foreground text-xs">
          {row.original.items} items
        </div>
      </div>
    ),
  },
  {
    header: "Fulfillment Status",
    accessorKey: "fulfillmentStatus",
    cell: ({ row }: { row: { original: OrdersListRow } }) => (
      <div className="space-y-1">{getStatusBadge(row.original.status)}</div>
    ),
  },
  {
    header: "Payment Status",
    accessorKey: "paymentStatus",
    cell: ({ row }: { row: { original: OrdersListRow } }) => (
      <div className="space-y-1">
        {getPaymentStatusBadge(row.original.paymentStatus)}
      </div>
    ),
  },
];

export default function OrdersPage() {
  const router = useRouter();
  const session = useSession();
  const storeId = session?.data?.store?.id ?? "";
  const [searchTerm, setSearchTerm] = useState("");
  type StatusFilter =
    | "all"
    | "Pending"
    | "Processing"
    | "Shipped"
    | "Completed"
    | "Cancelled"
    | "Refunded"
    | "On-hold"
    | "Failed";
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  // For now, keep date picker uncontrolled to avoid prop mismatch

  const { data, isLoading, refetch } = useOrdersQuery({
    storeId,
    page: 1,
    limit: 10,
    search: searchTerm || undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  const filteredOrders = useMemo<OrdersListRow[]>(
    () => data?.orders ?? [],
    [data],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Orders Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor and manage all customer orders
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button asChild>
            <Link href="/admin/orders/create">
              <Plus className="mr-2 h-4 w-4" />
              Create Order
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <OrdersStats />

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>All Orders</CardTitle>
              <CardDescription>
                Manage and track customer orders
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <DatePickerWithRange />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative max-w-sm flex-1">
              <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
              <Input
                placeholder="Search orders, customers..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as StatusFilter)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Processing">Processing</SelectItem>
                <SelectItem value="Shipped">Shipped</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
                <SelectItem value="Refunded">Refunded</SelectItem>
                <SelectItem value="On-hold">On-hold</SelectItem>
                <SelectItem value="Failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="Paid">Paid</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Refunded">Refunded</SelectItem>
                <SelectItem value="Failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DataTable
            columns={columns}
            data={filteredOrders}
            isLoading={isLoading}
            emptyMessage="No orders match your filters. Try adjusting your search criteria."
            emptyIcon={<ShoppingCart className="h-12 w-12 opacity-20" />}
            onRowClick={(row) => router.push(`/admin/orders/${row.id}`)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
