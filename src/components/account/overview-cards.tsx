"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { fetchOrders } from "@/lib/api/orders";
import { fetchAddresses } from "@/lib/api/addresses";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, MapPin, CheckCircle, Clock } from "lucide-react";

export default function OverviewCards() {
  const { data: ordersData } = useQuery({
    queryKey: ["orders", { page: 1, limit: 3 }],
    queryFn: () => fetchOrders({ page: 1, limit: 3 }),
  });

  const { data: addressesData } = useQuery({
    queryKey: ["addresses"],
    queryFn: () => fetchAddresses(),
  });

  const orders = ordersData?.orders ?? [];
  const numDelivered = orders.filter((o) => o.status === "delivered").length;

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Recent Orders</CardTitle>
          <Package className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{orders.length}</div>
          <p className="text-muted-foreground text-xs">
            {numDelivered} delivered, {orders.length - numDelivered} in transit
          </p>
          <Link href="/account/orders">
            <Button variant="outline" size="sm" className="mt-3 bg-transparent">
              View All Orders
            </Button>
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Saved Addresses</CardTitle>
          <MapPin className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {addressesData?.addresses.length ?? 0}
          </div>
          <p className="text-muted-foreground text-xs">
            {(addressesData?.addresses ?? []).some((a) => a.isDefault)
              ? "1 default address"
              : ""}
          </p>
          <Link href="/account/addresses">
            <Button variant="outline" size="sm" className="mt-3 bg-transparent">
              Manage Addresses
            </Button>
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Account Status</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">Active</div>
          <p className="text-muted-foreground text-xs">Welcome back</p>
          <Link href="/account/settings">
            <Button variant="outline" size="sm" className="mt-3 bg-transparent">
              Account Settings
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
