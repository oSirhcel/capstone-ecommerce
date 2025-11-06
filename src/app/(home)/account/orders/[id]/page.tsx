"use client";

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
import { useOrderQuery } from "@/hooks/use-order-query";
import { Skeleton } from "@/components/ui/skeleton";
import ConfirmationDialog from "@/components/ui/confirmation-dialog";
import { toast } from "sonner";

const getStatusBadge = (status: string) => {
  switch (status) {
    case "Completed":
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          Delivered
        </Badge>
      );
    case "Processing":
      return (
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
          Processing
        </Badge>
      );
    case "Shipped":
      return (
        <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
          Shipped
        </Badge>
      );
    case "Pending":
      return (
        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
          Pending
        </Badge>
      );
    case "Cancelled":
      return <Badge variant="destructive">Cancelled</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

export default function OrderPage() {
  const params = useParams();

  const orderId = parseInt(params.id as string);
  const { data, isLoading, isError } = useOrderQuery(orderId);

  const handleCancelOrder = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}/cancel`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reason: "Cancelled by customer",
        }),
      });

      if (!response.ok) {
        const error = (await response.json()) as {
          error?: string;
          details?: string;
        };
        const errorMessage = error.error ?? "Failed to cancel order";
        const errorDetails = error.details ? ` (${error.details})` : "";
        throw new Error(`${errorMessage}${errorDetails}`);
      }

      toast.success("Order cancelled successfully");
      // Redirect back to orders page
      window.location.href = "/account/orders";
    } catch (error) {
      console.error("Error cancelling order:", error);
      toast.error("Failed to cancel order. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
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
            <Skeleton className="h-8 w-32" />
            <div className="flex items-center gap-4">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Order Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Shipping Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-6">
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
            <h1 className="text-3xl font-bold">Order Not Found</h1>
            <p className="text-muted-foreground">
              The order you&apos;re looking for doesn&apos;t exist or you
              don&apos;t have permission to view it.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const order = data.order;
  const subtotal = order.items.reduce(
    (sum, item) => sum + item.priceAtTime * item.quantity,
    0,
  );
  const tax = subtotal * 0.1;
  const shipping = order.totalAmount - subtotal - tax;

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
          <h1 className="text-3xl font-bold">#{order.id}</h1>
          <div className="flex items-center gap-4">
            {getStatusBadge(order.status)}
            <span className="text-muted-foreground">
              Placed on {new Date(order.createdAt).toLocaleDateString()}
            </span>
            <span className="font-semibold">
              ${(order.totalAmount / 100).toFixed(2)}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Download Invoice
          </Button>
          {order.status === "Pending" && (
            <ConfirmationDialog
              trigger={
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel Order
                </Button>
              }
              title="Cancel Order"
              description="Are you sure you want to cancel this order? This action cannot be undone and the items will be returned to inventory."
              confirmText="Cancel Order"
              cancelText="Keep Order"
              onConfirm={handleCancelOrder}
              variant="destructive"
            />
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
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 rounded-lg border p-4"
                  >
                    <Image
                      src="/placeholder.svg"
                      alt={item.productName ?? "Product"}
                      width={80}
                      height={80}
                      className="rounded-md object-contain"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium">
                        {item.productName ?? "Product"}
                      </h4>
                      <p className="text-muted-foreground text-sm">
                        ${(item.priceAtTime / 100).toFixed(2)} × {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        ${((item.priceAtTime * item.quantity) / 100).toFixed(2)}
                      </p>
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
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex-shrink-0">
                    <div
                      className={`h-3 w-3 rounded-full ${
                        order.status === "Failed"
                          ? "bg-red-500"
                          : "bg-green-500"
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">
                        {order.status === "Failed"
                          ? "Order Failed"
                          : "Order Placed"}
                      </h4>
                      <span className="text-muted-foreground text-sm">
                        {new Date(order.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {order.status === "Failed"
                        ? "Your order could not be processed successfully"
                        : "Your order was successfully placed"}
                    </p>
                  </div>
                </div>

                {order.status === "Completed" && (
                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex-shrink-0">
                      <div className="h-3 w-3 rounded-full bg-green-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Order Completed</h4>
                        <span className="text-muted-foreground text-sm">
                          {new Date(order.updatedAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-muted-foreground mt-1 text-sm">
                        Your order has been completed
                      </p>
                    </div>
                  </div>
                )}

                {order.status === "Processing" && (
                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex-shrink-0">
                      <div className="h-3 w-3 rounded-full bg-blue-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Processing</h4>
                        <span className="text-muted-foreground text-sm">
                          {new Date(order.updatedAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-muted-foreground mt-1 text-sm">
                        Your order is being prepared
                      </p>
                    </div>
                  </div>
                )}

                {order.status === "Cancelled" && (
                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex-shrink-0">
                      <div className="h-3 w-3 rounded-full bg-red-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Order Cancelled</h4>
                        <span className="text-muted-foreground text-sm">
                          {new Date(order.updatedAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-muted-foreground mt-1 text-sm">
                        Your order has been cancelled
                      </p>
                    </div>
                  </div>
                )}
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
              {order.shipping ? (
                <>
                  <div>
                    <p className="font-medium">
                      {order.shipping.method ?? "Standard Shipping"}
                    </p>
                    {order.shipping.trackingNumber && (
                      <p className="text-muted-foreground text-sm">
                        Tracking: {order.shipping.trackingNumber}
                      </p>
                    )}
                    {order.shipping.description && (
                      <p className="text-muted-foreground text-sm">
                        {order.shipping.description}
                      </p>
                    )}
                  </div>

                  {order.shipping.address && (
                    <div className="border-t pt-4">
                      <div className="flex items-start gap-2">
                        <MapPin className="text-muted-foreground mt-0.5 h-4 w-4" />
                        <div className="text-sm">
                          <p className="font-medium">
                            {order.shipping.address.firstName}{" "}
                            {order.shipping.address.lastName}
                          </p>
                          <p>{order.shipping.address.addressLine1}</p>
                          {order.shipping.address.addressLine2 && (
                            <p>{order.shipping.address.addressLine2}</p>
                          )}
                          <p>
                            {order.shipping.address.city},{" "}
                            {order.shipping.address.state}{" "}
                            {order.shipping.address.postcode}
                          </p>
                          <p>{order.shipping.address.country}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {order.shipping.shippedAt && (
                    <div className="border-t pt-4">
                      <p className="text-sm">
                        <span className="font-medium">Shipped:</span>{" "}
                        {new Date(
                          order.shipping.shippedAt,
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  {order.shipping.deliveredAt && (
                    <div className="border-t pt-4">
                      <p className="text-sm">
                        <span className="font-medium">Delivered:</span>{" "}
                        {new Date(
                          order.shipping.deliveredAt,
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div>
                  <p className="font-medium">Standard Shipping</p>
                  <p className="text-muted-foreground text-sm">
                    Shipping information will be updated when available
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
              {order.payment ? (
                <>
                  <div>
                    <p className="font-medium">
                      {order.payment.paymentMethod?.type === "credit_card"
                        ? "Credit Card"
                        : (order.payment.paymentMethod?.type ??
                          "Payment Method")}
                    </p>
                    {order.payment.paymentMethod?.provider && (
                      <p className="text-muted-foreground text-sm">
                        {order.payment.paymentMethod.provider}
                        {order.payment.paymentMethod.lastFourDigits &&
                          ` ending in ${order.payment.paymentMethod.lastFourDigits}`}
                      </p>
                    )}
                    <p className="text-muted-foreground text-sm">
                      Status: {order.payment.status}
                    </p>
                    {order.payment.transactionId && (
                      <p className="text-muted-foreground text-sm">
                        Transaction ID: {order.payment.transactionId}
                      </p>
                    )}
                    <p className="text-muted-foreground text-sm">
                      Processed:{" "}
                      {new Date(order.payment.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {order.payment.billingAddress && (
                    <div className="border-t pt-4">
                      <h4 className="mb-2 font-medium">Billing Address</h4>
                      <div className="text-sm">
                        <p className="font-medium">
                          {order.payment.billingAddress.firstName}{" "}
                          {order.payment.billingAddress.lastName}
                        </p>
                        <p>{order.payment.billingAddress.addressLine1}</p>
                        {order.payment.billingAddress.addressLine2 && (
                          <p>{order.payment.billingAddress.addressLine2}</p>
                        )}
                        <p>
                          {order.payment.billingAddress.city},{" "}
                          {order.payment.billingAddress.state}{" "}
                          {order.payment.billingAddress.postcode}
                        </p>
                        <p>{order.payment.billingAddress.country}</p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 border-t pt-4">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>${(subtotal / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Shipping</span>
                      <span>${(shipping / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Tax</span>
                      <span>${(tax / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 font-semibold">
                      <span>Total</span>
                      <span>${(order.totalAmount / 100).toFixed(2)}</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="font-medium">Payment Method</p>
                    <p className="text-muted-foreground text-sm">
                      Payment details will be displayed here
                    </p>
                  </div>

                  <div className="space-y-2 border-t pt-4">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>${(subtotal / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Shipping</span>
                      <span>${(shipping / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Tax</span>
                      <span>${(tax / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 font-semibold">
                      <span>Total</span>
                      <span>${(order.totalAmount / 100).toFixed(2)}</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
