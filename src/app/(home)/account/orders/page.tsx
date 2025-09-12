"use client";

import { useState } from "react";
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
import { Search, Eye, Package, X } from "lucide-react";
import Image from "next/image";

// Mock orders data - in real app, this would come from API
const orders = [
  {
    id: "ORD-2024-001",
    date: "2024-01-15",
    status: "delivered",
    total: 156.97,
    itemCount: 3,
    items: [
      {
        id: "1",
        name: "Handcrafted Ceramic Mug",
        image: "/placeholder.svg?height=60&width=60",
        price: 24.99,
        quantity: 2,
        store: "Artisan Crafts",
      },
      {
        id: "2",
        name: "Organic Cotton T-Shirt",
        image: "/placeholder.svg?height=60&width=60",
        price: 34.99,
        quantity: 1,
        store: "Eco Essentials",
      },
    ],
    canCancel: false,
  },
  {
    id: "ORD-2024-002",
    date: "2024-01-20",
    status: "processing",
    total: 89.5,
    itemCount: 2,
    items: [
      {
        id: "3",
        name: "Wireless Headphones",
        image: "/placeholder.svg?height=60&width=60",
        price: 79.99,
        quantity: 1,
        store: "Tech Hub",
      },
    ],
    canCancel: true,
  },
  {
    id: "ORD-2024-003",
    date: "2024-01-22",
    status: "shipped",
    total: 234.99,
    itemCount: 4,
    items: [
      {
        id: "4",
        name: "Premium Leather Wallet",
        image: "/placeholder.svg?height=60&width=60",
        price: 89.99,
        quantity: 1,
        store: "Luxury Goods",
      },
      {
        id: "5",
        name: "Stainless Steel Watch",
        image: "/placeholder.svg?height=60&width=60",
        price: 145.0,
        quantity: 1,
        store: "Timepieces Co",
      },
    ],
    canCancel: false,
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

export default function OrdersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.items.some(
        (item) =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.store.toLowerCase().includes(searchTerm.toLowerCase()),
      );

    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleCancelOrder = (orderId: string) => {
    //TODO: API call
    console.log("Cancelling order:", orderId);
  };

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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Orders</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
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
          filteredOrders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="text-lg">{order.id}</CardTitle>
                    <CardDescription>
                      Placed on {new Date(order.date).toLocaleDateString()} •{" "}
                      {order.itemCount} items
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(order.status)}
                    <span className="font-semibold">
                      ${order.total.toFixed(2)}
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
                        src={item.image || "/placeholder.svg"}
                        alt={item.name}
                        width={48}
                        height={48}
                        className="rounded-md object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{item.name}</p>
                        <p className="text-muted-foreground text-sm">
                          {item.store} • Qty: {item.quantity} • $
                          {item.price.toFixed(2)}
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
                  {order.canCancel && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCancelOrder(order.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Cancel Order
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
