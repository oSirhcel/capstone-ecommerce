import { Suspense } from "react";
import { OrderHeader } from "@/components/admin/orders/order-header";
import { OrderItems } from "@/components/admin/orders/order-items";
import { OrderCustomer } from "@/components/admin/orders/order-customer";
import { OrderShipping } from "@/components/admin/orders/order-shipping";
import { OrderPayment } from "@/components/admin/orders/order-payment";
import { OrderTimeline } from "@/components/admin/orders/order-timeline";
import { OrderActions } from "@/components/admin/orders/order-actions";

const orderData = {
  id: "ORD-2024-001",
  status: "Processing",
  date: "2024-01-15",
  total: 156.97,
  customer: {
    id: "CUST-001",
    name: "Sarah Johnson",
    email: "sarah.johnson@email.com",
    phone: "+61 2 9123 4567",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  items: [
    {
      id: "1",
      name: "Handcrafted Ceramic Mug",
      image: "/placeholder.svg?height=60&width=60",
      price: 24.99,
      quantity: 2,
      total: 49.98,
      store: "Artisan Crafts",
    },
    {
      id: "2",
      name: "Organic Cotton T-Shirt",
      image: "/placeholder.svg?height=60&width=60",
      price: 34.99,
      quantity: 1,
      total: 34.99,
      store: "Eco Essentials",
    },
  ],
  shipping: {
    method: "Standard Shipping",
    cost: 12.0,
    estimatedDelivery: "2024-01-20",
    address: {
      street: "42 George Street",
      city: "Sydney",
      state: "NSW",
      zip: "2000",
      country: "Australia",
    },
  },
  payment: {
    method: "Credit Card",
    last4: "4242",
    billingAddress: {
      street: "42 George Street",
      city: "Sydney",
      state: "NSW",
      zip: "2000",
      country: "Australia",
    },
  },
  timeline: [
    {
      status: "Order Placed",
      date: "2024-01-15 10:30 AM",
      description: "Order was successfully placed",
    },
    {
      status: "Payment Confirmed",
      date: "2024-01-15 10:32 AM",
      description: "Payment processed successfully",
    },
    {
      status: "Processing",
      date: "2024-01-15 2:15 PM",
      description: "Order is being prepared for shipment",
    },
  ],
};

export default function OrderViewPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-6">
      <Suspense fallback={<div>Loading...</div>}>
        <OrderHeader order={orderData} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <OrderItems items={orderData.items} />
            <OrderTimeline timeline={orderData.timeline} />
          </div>

          <div className="space-y-6">
            <OrderActions orderId={orderData.id} />
            <OrderCustomer customer={orderData.customer} />
            <OrderShipping shipping={orderData.shipping} />
            <OrderPayment payment={orderData.payment} total={orderData.total} />
          </div>
        </div>
      </Suspense>
    </div>
  );
}
