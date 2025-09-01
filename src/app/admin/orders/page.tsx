"use client";

import { useState } from "react";
import Link from "next/link";
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
import { Search, Plus, Eye, Download, RefreshCw } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { OrdersStats } from "@/components/admin/orders/orders-stats";

const orders = [
  {
    id: "ORD-1234",
    customer: {
      name: "John Doe",
      email: "john@example.com",
      avatar: "/placeholder.svg?height=32&width=32",
    },
    amount: 89.99,
    status: "completed",
    date: "2024-01-15",
    items: 3,
    paymentStatus: "paid",
    shippingAddress: "123 Main St, New York, NY 10001",
  },
  {
    id: "ORD-1235",
    customer: {
      name: "Sarah Johnson",
      email: "sarah@example.com",
      avatar: "/placeholder.svg?height=32&width=32",
    },
    amount: 156.5,
    status: "processing",
    date: "2024-01-15",
    items: 2,
    paymentStatus: "paid",
    shippingAddress: "456 Oak Ave, Los Angeles, CA 90210",
  },
  {
    id: "ORD-1236",
    customer: {
      name: "Mike Chen",
      email: "mike@example.com",
      avatar: "/placeholder.svg?height=32&width=32",
    },
    amount: 45.0,
    status: "shipped",
    date: "2024-01-14",
    items: 1,
    paymentStatus: "paid",
    shippingAddress: "789 Pine St, Chicago, IL 60601",
  },
  {
    id: "ORD-1237",
    customer: {
      name: "Emily Rodriguez",
      email: "emily@example.com",
      avatar: "/placeholder.svg?height=32&width=32",
    },
    amount: 234.99,
    status: "pending",
    date: "2024-01-14",
    items: 5,
    paymentStatus: "pending",
    shippingAddress: "321 Elm St, Miami, FL 33101",
  },
  {
    id: "ORD-1238",
    customer: {
      name: "David Wilson",
      email: "david@example.com",
      avatar: "/placeholder.svg?height=32&width=32",
    },
    amount: 67.5,
    status: "cancelled",
    date: "2024-01-13",
    items: 2,
    paymentStatus: "refunded",
    shippingAddress: "654 Maple Dr, Seattle, WA 98101",
  },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case "completed":
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          Completed
        </Badge>
      );
    case "processing":
      return (
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
          Processing
        </Badge>
      );
    case "shipped":
      return (
        <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
          Shipped
        </Badge>
      );
    case "pending":
      return (
        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
          Pending
        </Badge>
      );
    case "cancelled":
      return <Badge variant="destructive">Cancelled</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

const getPaymentStatusBadge = (status: string) => {
  switch (status) {
    case "paid":
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          Paid
        </Badge>
      );
    case "pending":
      return (
        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
          Pending
        </Badge>
      );
    case "refunded":
      return (
        <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
          Refunded
        </Badge>
      );
    case "failed":
      return <Badge variant="destructive">Failed</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

const columns = [
  {
    header: "Order",
    accessorKey: "id",
    cell: ({ row }: any) => (
      <div className="font-medium">
        <Link
          href={`/admin/orders/${row.original.id}`}
          className="hover:underline"
        >
          {row.original.id}
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
    cell: ({ row }: any) => (
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
    cell: ({ row }: any) => (
      <div className="text-right">
        <div className="font-medium">${row.original.amount.toFixed(2)}</div>
        <div className="text-muted-foreground text-xs">
          {row.original.items} items
        </div>
      </div>
    ),
  },
  {
    header: "Status",
    accessorKey: "status",
    cell: ({ row }: any) => (
      <div className="space-y-1">
        {getStatusBadge(row.original.status)}
        <div className="text-xs">
          {getPaymentStatusBadge(row.original.paymentStatus)}
        </div>
      </div>
    ),
  },
  {
    header: "Actions",
    cell: ({ row }: any) => (
      <div className="flex gap-1">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/admin/orders/${row.original.id}`}>
            <Eye className="h-3 w-3" />
            <span className="sr-only">View order</span>
          </Link>
        </Button>
      </div>
    ),
  },
];

export default function OrdersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;
    const matchesPayment =
      paymentFilter === "all" || order.paymentStatus === paymentFilter;

    return matchesSearch && matchesStatus && matchesPayment;
  });

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
          <Button variant="outline" size="sm">
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DataTable columns={columns} data={filteredOrders} />
        </CardContent>
      </Card>
    </div>
  );
}
