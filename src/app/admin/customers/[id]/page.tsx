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
  name: "Sarah Johnson",
  email: "sarah.johnson@example.com",
  phone: "+1 (555) 123-4567",
  avatar: "/placeholder.svg?height=80&width=80",
  status: "Active",
  customerSince: "2023-03-15",
  lastOrder: "2024-01-10",
  totalSpent: 1247.89,
  totalOrders: 12,
  averageOrderValue: 103.99,
  location: "New York, NY",
  tags: ["VIP", "Repeat Customer"],
  notes:
    "Prefers eco-friendly products. Excellent customer, always pays on time.",
  marketingConsent: true,
  emailVerified: true,
  phoneVerified: false,
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
