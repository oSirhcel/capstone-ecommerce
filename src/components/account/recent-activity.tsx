"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchOrders } from "@/lib/api/orders";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, MapPin } from "lucide-react";

export default function RecentActivity() {
  const { data } = useQuery({
    queryKey: ["orders", { page: 1, limit: 5 }],
    queryFn: () => fetchOrders({ page: 1, limit: 5 }),
  });

  const orders = data?.orders ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="text-muted-foreground text-sm">
              No recent orders.
            </div>
          ) : (
            orders.map((o) => (
              <div key={o.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      Order #{o.id} {o.status}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {o.items.slice(0, 1)[0]?.productName || "Items"}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary">
                  {new Date(o.createdAt).toLocaleDateString()}
                </Badge>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
