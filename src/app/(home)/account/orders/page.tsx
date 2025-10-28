"use client";

import { useMemo, useState } from "react";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Eye, Package } from "lucide-react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { fetchOrders, type OrderDTO } from "@/lib/api/orders";
import { formatOrderNumber } from "@/lib/utils/order-number";

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
    case "Refunded":
      return (
        <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">
          Refunded
        </Badge>
      );
    case "On-hold":
      return (
        <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
          On Hold
        </Badge>
      );
    case "Failed":
      return <Badge variant="destructive">Failed</Badge>;
    case "Denied":
      return <Badge variant="destructive">Denied</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

export default function OrdersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["orders", { page: 1, limit: 20 }],
    queryFn: () => fetchOrders({ page: 1, limit: 20 }),
  });

  const filteredOrders = useMemo(() => {
    const orders = data?.orders ?? [];
    const term = searchTerm.toLowerCase();
    return orders.filter((order: OrderDTO) => {
      const matchesSearch =
        String(order.id).toLowerCase().includes(term) ||
        order.items.some((item) =>
          (item.productName ?? "").toLowerCase().includes(term),
        );

      const matchesStatus =
        statusFilter === "all" || order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [data?.orders, searchTerm, statusFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Orders</h1>
        <p className="text-muted-foreground">
          Track and manage your order history
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            {/* Search and Status Filter Row */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative max-w-sm flex-1">
                <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
                <Input
                  placeholder="Search orders, products, stores..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Orders</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Processing">Processing</SelectItem>
                    <SelectItem value="Shipped">Shipped</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                    <SelectItem value="Refunded">Refunded</SelectItem>
                    <SelectItem value="Failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Results Summary */}
            <div className="text-muted-foreground flex items-center justify-between text-sm">
              <span>
                {filteredOrders.length} order
                {filteredOrders.length !== 1 ? "s" : ""} found
                {statusFilter !== "all" && ` (${statusFilter})`}
                {searchTerm && ` matching "${searchTerm}"`}
              </span>
              {(searchTerm || statusFilter !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                  }}
                >
                  Clear filters
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <div className="space-y-4">
        {isLoading ? (
          <Card>
            <CardContent className="py-12">Loading orders...</CardContent>
          </Card>
        ) : isError ? (
          <Card>
            <CardContent className="py-12">Failed to load orders.</CardContent>
          </Card>
        ) : filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="text-muted-foreground mb-4 h-12 w-12" />
              <h3 className="mb-2 text-lg font-semibold">No orders found</h3>
              <p className="text-muted-foreground mb-4 text-center">
                {searchTerm || statusFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "You haven't placed any orders yet"}
              </p>
              <Button asChild>
                <Link href="/">Start Shopping</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredOrders.map((order: OrderDTO) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {formatOrderNumber(order.id)}
                    </CardTitle>
                    <CardDescription>
                      Placed on {new Date(order.createdAt).toLocaleDateString()}{" "}
                      • {order.items.length} items
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(order.status)}
                    <span className="font-semibold">
                      ${(order.totalAmount / 100).toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Order Items Preview */}
                <div className="mb-4 space-y-3">
                  {order.items.slice(0, 2).map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <Image
                        src={"/placeholder.svg"}
                        alt={item.productName ?? "Item"}
                        width={48}
                        height={48}
                        className="rounded-md object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">
                          {item.productName}
                        </p>
                        <p className="text-muted-foreground text-sm">
                          Qty: {item.quantity} • $
                          {(item.priceAtTime / 100).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                  {order.items.length > 2 && (
                    <p className="text-muted-foreground text-sm">
                      +{order.items.length - 2} more items
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 border-t pt-4">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/account/orders/${order.id}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </Link>
                  </Button>
                  {/* Cancel disabled until API supports it */}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
