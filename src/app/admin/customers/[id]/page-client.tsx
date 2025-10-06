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

interface CustomerDetailPageClientProps {
  customerId: string;
}

export default function CustomerDetailPageClient({
  customerId,
}: CustomerDetailPageClientProps) {
  const session = useSession();
  const storeId = session.data?.store?.id;

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
      location: customer.location,
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

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Loading customer details...</p>
      </div>
    );
  }

  if (!customer || !customerHeader || !customerStats || !storeId) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Customer not found</p>
      </div>
    );
  }

  return (
    <CustomerDetailProvider customerId={customerId}>
      <div className="space-y-6">
        <CustomerHeader customer={customerHeader} />

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
            <CustomerAddresses />
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
