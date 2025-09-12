"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Package,
  Truck,
  MapPin,
  CreditCard,
  X,
  Download,
} from "lucide-react";
import Image from "next/image";

// Mock order data
const orderData = {
  id: "ORD-2024-001",
  date: "2024-01-15",
  status: "delivered",
  total: 156.97,
  canCancel: true,
  items: [
    {
      id: "1",
      name: "Handcrafted Ceramic Mug",
      image: "/placeholder.svg?height=80&width=80",
      price: 24.99,
      quantity: 2,
      total: 49.98,
      store: "Artisan Crafts",
    },
    {
      id: "2",
      name: "Organic Cotton T-Shirt",
      image: "/placeholder.svg?height=80&width=80",
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
    actualDelivery: "2024-01-19",
    address: {
      name: "John Doe",
      street: "123 Main Street",
      city: "New York",
      state: "NY",
      zip: "10001",
      country: "United States",
    },
    trackingNumber: "1Z999AA1234567890",
  },
  payment: {
    method: "Credit Card",
    last4: "4242",
    billingAddress: {
      name: "John Doe",
      street: "123 Main Street",
      city: "New York",
      state: "NY",
      zip: "10001",
      country: "United States",
    },
  },
  timeline: [
    {
      status: "Order Placed",
      date: "2024-01-15 10:30 AM",
      description: "Your order was successfully placed",
    },
    {
      status: "Payment Confirmed",
      date: "2024-01-15 10:32 AM",
      description: "Payment processed successfully",
    },
    {
      status: "Processing",
      date: "2024-01-15 2:15 PM",
      description: "Your order is being prepared for shipment",
    },
    {
      status: "Shipped",
      date: "2024-01-16 9:00 AM",
      description: "Your order has been shipped",
    },
    {
      status: "Delivered",
      date: "2024-01-19 3:45 PM",
      description: "Your order has been delivered",
    },
  ],
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "delivered":
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          Delivered
        </Badge>
      );
    case "processing":
      return (
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
          Processing
        </Badge>
      );
    case "shipped":
      return (
        <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
          Shipped
        </Badge>
      );
    case "pending":
      return (
        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
          Pending
        </Badge>
      );
    case "cancelled":
      return <Badge variant="destructive">Cancelled</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

export default function OrderPage() {
  const params = useParams();
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const subtotal = orderData.items.reduce((sum, item) => sum + item.total, 0);
  const tax = subtotal * 0.08;

  const handleCancelOrder = () => {
    //TODO: API call
    console.log("Cancelling order:", orderData.id);
    setShowCancelDialog(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Link
              href="/account/orders"
              className="hover:text-foreground flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to orders
            </Link>
          </div>
          <h1 className="text-3xl font-bold">{orderData.id}</h1>
          <div className="flex items-center gap-4">
            {getStatusBadge(orderData.status)}
            <span className="text-muted-foreground">
              Placed on {new Date(orderData.date).toLocaleDateString()}
            </span>
            <span className="font-semibold">${orderData.total.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Download Invoice
          </Button>
          {orderData.canCancel && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCancelDialog(true)}
              className="text-red-600 hover:text-red-700"
            >
              <X className="mr-2 h-4 w-4" />
              Cancel Order
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orderData.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 rounded-lg border p-4"
                  >
                    <Image
                      src={item.image || "/placeholder.svg"}
                      alt={item.name}
                      width={80}
                      height={80}
                      className="rounded-md object-cover"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium">{item.name}</h4>
                      <p className="text-muted-foreground text-sm">
                        Store: {item.store}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        ${item.price.toFixed(2)} × {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${item.total.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Order Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Order Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orderData.timeline.map((event, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="mt-1 flex-shrink-0">
                      <div className="h-3 w-3 rounded-full bg-green-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{event.status}</h4>
                        <span className="text-muted-foreground text-sm">
                          {event.date}
                        </span>
                      </div>
                      <p className="text-muted-foreground mt-1 text-sm">
                        {event.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Shipping Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Shipping Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-medium">{orderData.shipping.method}</p>
                {orderData.shipping.trackingNumber && (
                  <p className="text-muted-foreground text-sm">
                    Tracking: {orderData.shipping.trackingNumber}
                  </p>
                )}
              </div>

              <div className="border-t pt-4">
                <div className="flex items-start gap-2">
                  <MapPin className="text-muted-foreground mt-0.5 h-4 w-4" />
                  <div className="text-sm">
                    <p className="font-medium">
                      {orderData.shipping.address.name}
                    </p>
                    <p>{orderData.shipping.address.street}</p>
                    <p>
                      {orderData.shipping.address.city},{" "}
                      {orderData.shipping.address.state}{" "}
                      {orderData.shipping.address.zip}
                    </p>
                    <p>{orderData.shipping.address.country}</p>
                  </div>
                </div>
              </div>

              {orderData.shipping.actualDelivery && (
                <div className="border-t pt-4">
                  <p className="text-sm">
                    <span className="font-medium">Delivered:</span>{" "}
                    {new Date(
                      orderData.shipping.actualDelivery,
                    ).toLocaleDateString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-medium">
                  {orderData.payment.method} ending in {orderData.payment.last4}
                </p>
              </div>

              <div className="border-t pt-4">
                <h4 className="mb-2 font-medium">Billing Address</h4>
                <div className="text-sm">
                  <p className="font-medium">
                    {orderData.payment.billingAddress.name}
                  </p>
                  <p>{orderData.payment.billingAddress.street}</p>
                  <p>
                    {orderData.payment.billingAddress.city},{" "}
                    {orderData.payment.billingAddress.state}{" "}
                    {orderData.payment.billingAddress.zip}
                  </p>
                  <p>{orderData.payment.billingAddress.country}</p>
                </div>
              </div>

              <div className="space-y-2 border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span>${orderData.shipping.cost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t pt-2 font-semibold">
                  <span>Total</span>
                  <span>${orderData.total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
