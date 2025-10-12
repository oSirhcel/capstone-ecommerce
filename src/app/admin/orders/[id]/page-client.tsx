"use client";

import { Suspense, useMemo } from "react";
import { OrderHeader } from "@/components/admin/orders/order-header";
import { OrderItems } from "@/components/admin/orders/order-items";
import { OrderCustomer } from "@/components/admin/orders/order-customer";
import { OrderShipping } from "@/components/admin/orders/order-shipping";
import { OrderPayment } from "@/components/admin/orders/order-payment";
import { OrderTimeline } from "@/components/admin/orders/order-timeline";
import { OrderActions } from "@/components/admin/orders/order-actions";
import { useOrderQuery } from "@/hooks/admin/orders/use-order-query";
import { useSession } from "next-auth/react";

export default function OrderViewPageClient({ orderId }: { orderId: string }) {
  const session = useSession();
  const storeId = session?.data?.store?.id ?? "";
  const idNum = Number(orderId);
  const { data: order, isLoading } = useOrderQuery({ id: idNum, storeId });

  const orderHeader = useMemo(() => {
    if (!order) return null;
    return {
      id: String(order.id),
      status: order.status,
      date: order.createdAt,
      total: order.totalAmount / 100,
      customer: {
        id: order.customer.id,
        name: order.customer.name,
        email: order.customer.email,
        phone: "",
        avatar: "/placeholder.svg?height=40&width=40",
      },
    };
  }, [order]);

  const items = useMemo(() => {
    if (!order)
      return [] as Array<{
        id: string;
        name: string;
        image: string;
        price: number;
        quantity: number;
        total: number;
        store: string;
      }>;
    return order.items.map((i) => ({
      id: String(i.id),
      name: i.productName ?? `Product #${i.productId}`,
      image: "/placeholder.svg?height=60&width=60",
      price: i.priceAtTime / 100,
      quantity: i.quantity,
      total: (i.priceAtTime * i.quantity) / 100,
      store: "",
    }));
  }, [order]);

  const timeline = useMemo(() => {
    if (!order)
      return [] as Array<{ status: string; date: string; description: string }>;
    return (
      (order.timeline as
        | Array<{ status: string; date: string; description: string }>
        | undefined) ?? []
    );
  }, [order]);

  const shipping = useMemo(() => {
    if (!order) {
      return {
        method: "Standard Shipping",
        cost: 0,
        estimatedDelivery: new Date().toISOString(),
        address: { street: "", city: "", state: "", zip: "", country: "" },
      };
    }
    const addr =
      order.addresses.find((a) => a.type === "shipping") ?? order.addresses[0];
    return {
      method: "Standard Shipping",
      cost: 0,
      estimatedDelivery: new Date().toISOString(),
      address: {
        street: addr?.addressLine1 ?? "",
        city: addr?.city ?? "",
        state: addr?.state ?? "",
        zip: addr?.postalCode ?? "",
        country: addr?.country ?? "",
      },
    };
  }, [order]);

  const payment = useMemo(() => {
    return {
      method: "Card",
      last4: "0000",
      billingAddress: {
        street: shipping.address.street,
        city: shipping.address.city,
        state: shipping.address.state,
        zip: shipping.address.zip,
        country: shipping.address.country,
      },
    };
  }, [shipping]);

  if (isLoading) {
    return <div className="p-6">Loading order...</div>;
  }

  if (!order || !orderHeader) {
    return <div className="p-6">Order not found</div>;
  }

  return (
    <div className="space-y-6">
      <Suspense fallback={<div>Loading...</div>}>
        <OrderHeader order={orderHeader} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <OrderItems items={items} />
            <OrderTimeline timeline={timeline} />
          </div>

          <div className="space-y-6">
            <OrderActions orderId={String(order.id)} />
            <OrderCustomer customer={orderHeader.customer} />
            <OrderShipping shipping={shipping} />
            <OrderPayment payment={payment} total={order.totalAmount / 100} />
          </div>
        </div>
      </Suspense>
    </div>
  );
}
