"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { fetchOrderStats } from "@/lib/api/orders";
import { fetchAddresses } from "@/lib/api/addresses";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, MapPin, CheckCircle } from "lucide-react";

export default function OverviewCards() {
  const {
    data: orderStats,
    isLoading: ordersLoading,
    error: ordersError,
  } = useQuery({
    queryKey: ["order-stats"],
    queryFn: fetchOrderStats,
  });

  const {
    data: addressesData,
    isLoading: addressesLoading,
    error: addressesError,
  } = useQuery({
    queryKey: ["addresses"],
    queryFn: () => fetchAddresses(),
  });

  // Use stats data directly
  const totalOrders = orderStats?.totalOrders ?? 0;
  const numDelivered = orderStats?.completedOrders ?? 0;
  const numInTransit = orderStats?.inTransitOrders ?? 0;
  const numPending = orderStats?.pendingOrders ?? 0;
  const numCancelled = orderStats?.cancelledOrders ?? 0;

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Recent Orders</CardTitle>
          <Package className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {ordersLoading ? "..." : totalOrders}
          </div>
          <p className="text-muted-foreground text-xs">
            {ordersLoading
              ? "Loading..."
              : ordersError
                ? "Error loading orders"
                : `${numDelivered} completed, ${numInTransit} in transit` +
                  (numPending > 0 ? `, ${numPending} pending` : "") +
                  (numCancelled > 0 ? `, ${numCancelled} cancelled` : "")}
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
            {addressesLoading ? "..." : (addressesData?.addresses.length ?? 0)}
          </div>
          <p className="text-muted-foreground text-xs">
            {addressesLoading
              ? "Loading..."
              : addressesError
                ? "Error loading addresses"
                : (addressesData?.addresses ?? []).some((a) => a.isDefault)
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
