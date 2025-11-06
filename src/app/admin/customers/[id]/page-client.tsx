"use client";

import { CustomerHeader } from "@/components/admin/customers/customer/customer-header";
import { CustomerStats } from "@/components/admin/customers/customer/customer-stats";
import { CustomerOrders } from "@/components/admin/customers/customer/customer-orders";
import { CustomerAddresses } from "@/components/admin/customers/customer/customer-addresses";
import { CustomerPayments } from "@/components/admin/customers/customer/customer-payments";
import { CustomerInteractions } from "@/components/admin/customers/customer/customer-interactions";
import { CustomerTimeline } from "@/components/admin/customers/customer/customer-timeline";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCustomerQuery } from "@/hooks/admin/customers/use-customer-query";
import { useSession } from "next-auth/react";
import { CustomerDetailProvider } from "@/contexts/customer-detail-context";
import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

interface CustomerDetailPageClientProps {
  customerId: string;
}

export default function CustomerDetailPageClient({
  customerId,
}: CustomerDetailPageClientProps) {
  const session = useSession();
  const storeId = session.data?.store?.id;
  const isSessionLoading = session.status === "loading";

  const { data: customer, isLoading } = useCustomerQuery({
    customerId,
    storeId,
  });

  // Memoize transformed customer data to avoid unnecessary recalculations
  const customerHeader = useMemo(() => {
    if (!customer) return null;
    return {
      id: customer.id,
      name: `${customer.firstName} ${customer.lastName}`.trim(),
      email: customer.email,
      phone: customer.phone,
      avatar: "/placeholder.svg",
      status: customer.status,
      customerSince: customer.customerSince,
      tags: customer.tags,
      notes: customer.notes,
      emailVerified: customer.emailVerified,
      phoneVerified: customer.phoneVerified,
    };
  }, [customer]);

  const customerStats = useMemo(() => {
    if (!customer) return null;
    return {
      totalSpent: customer.totalSpent,
      totalOrders: customer.totalOrders,
      averageOrderValue: customer.averageOrderValue,
      lastOrder: customer.lastOrder ?? "Never",
    };
  }, [customer]);

  if (isSessionLoading || isLoading || !storeId) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-4 w-32" />
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Skeleton className="h-8 w-48" />
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-6 w-24" />
                    </div>
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="h-4 w-40" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-10 w-24" />
                  <Skeleton className="h-10 w-10" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4" />
                </div>
                <Skeleton className="mt-2 h-8 w-20" />
                <Skeleton className="mt-1 h-3 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs Skeleton */}
        <div className="space-y-6">
          <Skeleton className="h-10 w-full" />
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!customer || !customerHeader || !customerStats) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Customer not found</p>
      </div>
    );
  }

  return (
    <CustomerDetailProvider customerId={customerId}>
      <div className="space-y-6">
        <CustomerHeader customer={customerHeader} storeId={storeId} />

        <CustomerStats customer={customerStats} />

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="addresses">Addresses</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="interactions">Support</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <CustomerOrders isOverview />
              <CustomerTimeline />
            </div>
          </TabsContent>

          <TabsContent value="orders">
            <CustomerOrders />
          </TabsContent>

          <TabsContent value="addresses">
            <CustomerAddresses customerId={customerId} storeId={storeId} />
          </TabsContent>

          <TabsContent value="payments">
            <CustomerPayments />
          </TabsContent>

          <TabsContent value="interactions">
            <CustomerInteractions />
          </TabsContent>
        </Tabs>
      </div>
    </CustomerDetailProvider>
  );
}
