import { CustomerHeader } from "@/components/admin/customers/customer/customer-header";
import { CustomerStats } from "@/components/admin/customers/customer/customer-stats";
import { CustomerOrders } from "@/components/admin/customers/customer/customer-orders";
import { CustomerAddresses } from "@/components/admin/customers/customer/customer-addresses";
import { CustomerPayments } from "@/components/admin/customers/customer/customer-payments";
import { CustomerInteractions } from "@/components/admin/customers/customer/customer-interactions";
import { CustomerTimeline } from "@/components/admin/customers/customer/customer-timeline";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Mock customer data - in a real app, this would be fetched based on the ID
const getCustomerData = (id: string) => ({
  id,
  name: "Emily Nguyen",
  email: "emily.nguyen@example.com",
  phone: "+61 2 9876 5432",
  avatar: "/placeholder.svg?height=80&width=80",
  status: "Active",
  customerSince: "2022-11-20",
  lastOrder: "2024-02-05",
  totalSpent: 1899.5,
  totalOrders: 18,
  averageOrderValue: 105.53,
  location: "Sydney, NSW",
  tags: ["NSW", "Loyal", "Newsletter Subscriber"],
  notes:
    "Enjoys local brands and fast shipping. Responds well to SMS offers. Based in New South Wales.",
  marketingConsent: true,
  emailVerified: true,
  phoneVerified: true,
});

export default function CustomerDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const customer = getCustomerData(params.id);

  return (
    <div className="space-y-6">
      <CustomerHeader customer={customer} />

      <CustomerStats customer={customer} />

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
            <CustomerOrders customerId={customer.id} isOverview />
            <CustomerTimeline customerId={customer.id} />
          </div>
        </TabsContent>

        <TabsContent value="orders">
          <CustomerOrders customerId={customer.id} />
        </TabsContent>

        <TabsContent value="addresses">
          <CustomerAddresses customerId={customer.id} />
        </TabsContent>

        <TabsContent value="payments">
          <CustomerPayments customerId={customer.id} />
        </TabsContent>

        <TabsContent value="interactions">
          <CustomerInteractions customerId={customer.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
