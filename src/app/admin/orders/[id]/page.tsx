import { OrderHeader } from "@/components/admin/orders/order-header";
import { OrderItems } from "@/components/admin/orders/order-items";
import { OrderCustomer } from "@/components/admin/orders/order-customer";
import { OrderShipping } from "@/components/admin/orders/order-shipping";
import { OrderPayment } from "@/components/admin/orders/order-payment";
import { OrderTimeline } from "@/components/admin/orders/order-timeline";
import { OrderActions } from "@/components/admin/orders/order-actions";

const mockOrder = {
  id: "ORD-2024-001",
  status: "processing",
  date: "2024-01-15T10:30:00Z",
  total: 299.97,
  subtotal: 249.97,
  tax: 25.0,
  shippingCost: 25.0,
  discount: 0,
  customer: {
    id: "CUST-001",
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "+1 (555) 123-4567",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  items: [
    {
      id: "1",
      name: "Wireless Bluetooth Headphones",
      image: "/placeholder.svg?height=80&width=80",
      price: 129.99,
      quantity: 1,
      total: 129.99,
      sku: "WBH-001",
    },
    {
      id: "2",
      name: "Smart Fitness Watch",
      image: "/placeholder.svg?height=80&width=80",
      price: 199.99,
      quantity: 1,
      total: 199.99,
      sku: "SFW-002",
    },
  ],
  shipping: {
    method: "Standard Shipping",
    cost: 25.0,
    estimatedDelivery: "2024-01-20",
    address: {
      name: "John Doe",
      street: "123 Main Street",
      city: "New York",
      state: "NY",
      zip: "10001",
      country: "United States",
    },
  },
  billing: {
    address: {
      name: "John Doe",
      street: "123 Main Street",
      city: "New York",
      state: "NY",
      zip: "10001",
      country: "United States",
    },
  },
  payment: {
    method: "Credit Card",
    last4: "4242",
    brand: "Visa",
    status: "paid",
  },
  timeline: [
    {
      id: "1",
      status: "placed",
      title: "Order Placed",
      description: "Order was successfully placed",
      timestamp: "2024-01-15T10:30:00Z",
      user: "Customer",
    },
    {
      id: "2",
      status: "confirmed",
      title: "Order Confirmed",
      description: "Payment confirmed and order accepted",
      timestamp: "2024-01-15T10:35:00Z",
      user: "System",
    },
    {
      id: "3",
      status: "processing",
      title: "Processing",
      description: "Order is being prepared for shipment",
      timestamp: "2024-01-15T11:00:00Z",
      user: "Admin",
    },
  ],
};

interface OrderViewPageProps {
  params: {
    id: string;
  };
}

export default function OrderViewPage({ params }: OrderViewPageProps) {
  const order = mockOrder; // In real app: await getOrder(params.id)

  return (
    <div className="space-y-6">
      <OrderHeader order={order} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <OrderItems items={order.items} />
          <OrderTimeline timeline={order.timeline} />
        </div>

        <div className="space-y-6">
          <OrderActions order={order} />
          <OrderCustomer customer={order.customer} />
          <OrderShipping shipping={order.shipping} />
          <OrderPayment
            payment={order.payment}
            billing={order.billing}
            totals={{
              subtotal: order.subtotal,
              tax: order.tax,
              shipping: order.shipping.cost,
              discount: order.discount,
              total: order.total,
            }}
          />
        </div>
      </div>
    </div>
  );
}
