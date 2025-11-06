"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Clock,
  ShoppingCart,
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  CreditCard,
  RotateCcw,
  AlertCircle,
  type LucideIcon,
} from "lucide-react";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { useCustomerDetail } from "@/contexts/customer-detail-context";
import { useCustomerOrdersQuery } from "@/hooks/admin/customers/use-customer-orders-query";
import { useSession } from "next-auth/react";
import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface TimelineEvent {
  id: string;
  type: "order" | "payment" | "account";
  title: string;
  description: string;
  timestamp: string;
  icon: LucideIcon;
  status?: string;
}

const getEventColor = (type: string, status?: string) => {
  if (type === "payment") {
    switch (status) {
      case "Paid":
        return "bg-green-500";
      case "Failed":
        return "bg-red-500";
      case "Refunded":
        return "bg-orange-500";
      default:
        return "bg-yellow-500";
    }
  }

  if (type === "order") {
    switch (status) {
      case "Completed":
        return "bg-green-500";
      case "Shipped":
        return "bg-blue-500";
      case "Processing":
        return "bg-blue-400";
      case "Cancelled":
      case "Failed":
      case "Denied":
        return "bg-red-500";
      case "Refunded":
        return "bg-orange-500";
      case "On-hold":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  }

  return "bg-purple-500";
};

const getOrderIcon = (status: string): LucideIcon => {
  switch (status) {
    case "Completed":
      return CheckCircle2;
    case "Shipped":
      return Truck;
    case "Processing":
      return Package;
    case "Cancelled":
    case "Failed":
    case "Denied":
      return XCircle;
    case "Refunded":
      return RotateCcw;
    case "On-hold":
      return AlertCircle;
    default:
      return ShoppingCart;
  }
};

const getOrderTitle = (status: string, orderNumber: string) => {
  switch (status) {
    case "Completed":
      return `Order ${orderNumber} Completed`;
    case "Shipped":
      return `Order ${orderNumber} Shipped`;
    case "Processing":
      return `Order ${orderNumber} Processing`;
    case "Cancelled":
      return `Order ${orderNumber} Cancelled`;
    case "Refunded":
      return `Order ${orderNumber} Refunded`;
    case "On-hold":
      return `Order ${orderNumber} On Hold`;
    case "Failed":
      return `Order ${orderNumber} Failed`;
    case "Denied":
      return `Order ${orderNumber} Denied`;
    default:
      return `Order ${orderNumber} Placed`;
  }
};

const getOrderDescription = (
  status: string,
  totalAmount: number,
  itemCount: number,
) => {
  const amount = `$${(totalAmount / 100).toFixed(2)}`;
  const items = itemCount === 1 ? "item" : "items";

  switch (status) {
    case "Completed":
      return `${amount} • ${itemCount} ${items} • Order successfully delivered`;
    case "Shipped":
      return `${amount} • ${itemCount} ${items} • Order is on its way`;
    case "Processing":
      return `${amount} • ${itemCount} ${items} • Order is being prepared`;
    case "Cancelled":
      return `${amount} • ${itemCount} ${items} • Order was cancelled`;
    case "Refunded":
      return `${amount} • ${itemCount} ${items} • Payment refunded`;
    case "On-hold":
      return `${amount} • ${itemCount} ${items} • Order is on hold`;
    case "Failed":
      return `${amount} • ${itemCount} ${items} • Order processing failed`;
    case "Denied":
      return `${amount} • ${itemCount} ${items} • Order was denied`;
    default:
      return `${amount} • ${itemCount} ${items} • Order placed`;
  }
};

const getPaymentTitle = (status: string, orderNumber: string) => {
  switch (status) {
    case "Paid":
      return `Payment Received for Order ${orderNumber}`;
    case "Failed":
      return `Payment Failed for Order ${orderNumber}`;
    case "Refunded":
      return `Payment Refunded for Order ${orderNumber}`;
    default:
      return `Payment Pending for Order ${orderNumber}`;
  }
};

const getPaymentDescription = (status: string, totalAmount: number) => {
  const amount = `$${(totalAmount / 100).toFixed(2)}`;
  switch (status) {
    case "Paid":
      return `${amount} • Payment successfully processed`;
    case "Failed":
      return `${amount} • Payment processing failed`;
    case "Refunded":
      return `${amount} • Payment has been refunded`;
    default:
      return `${amount} • Payment is pending`;
  }
};

export function CustomerTimeline() {
  const { customerId } = useCustomerDetail();
  const session = useSession();
  const storeId = session.data?.store?.id ?? "";

  const { data: ordersData, isLoading } = useCustomerOrdersQuery({
    customerId,
    storeId,
    page: 1,
    limit: 20, // Get more orders for timeline
  });

  const timelineEvents = useMemo<TimelineEvent[]>(() => {
    if (!ordersData?.orders) return [];

    const events: TimelineEvent[] = [];

    ordersData.orders.forEach((order) => {
      // Add order event
      events.push({
        id: `order-${order.id}`,
        type: "order",
        title: getOrderTitle(order.status, order.orderNumber),
        description: getOrderDescription(
          order.status,
          order.totalAmount,
          order.itemCount,
        ),
        timestamp: order.createdAt,
        icon: getOrderIcon(order.status),
        status: order.status,
      });

      // Add payment event if payment status is not pending
      if (order.paymentStatus && order.paymentStatus !== "Pending") {
        events.push({
          id: `payment-${order.id}`,
          type: "payment",
          title: getPaymentTitle(order.paymentStatus, order.orderNumber),
          description: getPaymentDescription(
            order.paymentStatus,
            order.totalAmount,
          ),
          timestamp: order.createdAt, // Use order creation time as payment time
          icon: CreditCard,
          status: order.paymentStatus,
        });
      }
    });

    // Sort by timestamp (most recent first)
    return events.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }, [ordersData]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Timeline
        </CardTitle>
        <CardDescription>
          Recent customer activity and interactions
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : timelineEvents.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Clock />
              </EmptyMedia>
              <EmptyTitle>No activity yet</EmptyTitle>
              <EmptyDescription>
                No timeline events to display. Customer activity will appear
                here as they interact with your store.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="space-y-4">
            {timelineEvents.map((event, index) => {
              const Icon = event.icon;
              return (
                <div key={event.id} className="flex gap-3">
                  <div className="relative">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full ${getEventColor(event.type, event.status)}`}
                    >
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    {index < timelineEvents.length - 1 && (
                      <div className="bg-border absolute top-8 left-4 h-6 w-px"></div>
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="font-medium">{event.title}</p>
                    <p className="text-muted-foreground text-sm">
                      {event.description}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {new Date(event.timestamp).toLocaleDateString()} at{" "}
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
