"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRecentOrdersQuery } from "@/hooks/admin/dashboard/use-dashboard-query";
import Link from "next/link";

const getStatusBadge = (status: string) => {
  switch (status.toLowerCase()) {
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
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

export function RecentOrders() {
  const session = useSession();
  const storeId = session?.data?.store?.id;
  const { data: ordersData, isLoading } = useRecentOrdersQuery(storeId, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Orders</CardTitle>
        <CardDescription>Latest orders from your marketplace</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
                  <div className="h-3 w-48 animate-pulse rounded bg-gray-200" />
                </div>
                <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
              </div>
            ))}
          </div>
        ) : !ordersData || ordersData.orders.length === 0 ? (
          <p className="text-muted-foreground text-sm">No recent orders</p>
        ) : (
          <div className="space-y-4">
            {ordersData.orders.map((order) => {
              const orderId = order.id.replace("#", "");
              return (
                <div
                  key={order.id}
                  className="flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{order.id}</p>
                      {getStatusBadge(order.status)}
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {order.customer} • {order.date}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{order.amount}</span>
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/admin/orders/${orderId}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
