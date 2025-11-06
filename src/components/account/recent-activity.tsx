"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchOrders } from "@/lib/api/orders";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle,
  Clock,
  Package,
  XCircle,
  AlertCircle,
} from "lucide-react";

export default function RecentActivity() {
  const { data, isLoading } = useQuery({
    queryKey: ["orders", { page: 1, limit: 5 }],
    queryFn: () => fetchOrders({ page: 1, limit: 5 }),
  });

  const orders = data?.orders ?? [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "Processing":
      case "Shipped":
        return <Package className="h-4 w-4 text-blue-600" />;
      case "Pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "Cancelled":
      case "Failed":
      case "Denied":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100";
      case "Processing":
      case "Shipped":
        return "bg-blue-100";
      case "Pending":
        return "bg-yellow-100";
      case "Cancelled":
      case "Failed":
      case "Denied":
        return "bg-red-100";
      default:
        return "bg-gray-100";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
                <Skeleton className="h-5 w-20" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-muted-foreground text-sm">
            No recent orders.
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((o) => (
              <div key={o.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${getStatusColor(o.status)}`}
                  >
                    {getStatusIcon(o.status)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      Order #{o.id} - {o.status}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {o.items.slice(0, 1)[0]?.productName ?? "Items"}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary">
                  {new Date(o.createdAt).toLocaleDateString()}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
