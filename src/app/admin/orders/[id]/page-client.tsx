"use client";

import { useMemo } from "react";
import { OrderHeader } from "@/components/admin/orders/order-header";
import { OrderItems } from "@/components/admin/orders/order-items";
import { OrderCustomer } from "@/components/admin/orders/order-customer";
import { OrderPayment } from "@/components/admin/orders/order-payment";
import { useOrderQuery } from "@/hooks/admin/orders/use-order-query";
import { useSession } from "next-auth/react";
import { OrderViewSkeleton } from "@/components/admin/orders/order-view-skeleton";

export default function OrderViewPageClient({ orderId }: { orderId: string }) {
  const session = useSession();
  const storeId = session?.data?.store?.id ?? "";
  const idNum = Number(orderId);
  const {
    data: order,
    isLoading,
    isError,
  } = useOrderQuery({ id: idNum, storeId });

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
        zip: addr?.postcode ?? "",
        country: addr?.country ?? "",
      },
    };
  }, [order]);

  const payment = useMemo(() => {
    if (!order) {
      return {
        method: "Card",
        last4: "0000",
        billingAddress: {
          street: "",
          city: "",
          state: "",
          zip: "",
          country: "",
        },
      };
    }
    const billingAddr =
      order.addresses.find((a) => a.type === "billing") ?? order.addresses[0];
    return {
      method: "Card",
      last4: "0000",
      billingAddress: {
        street: billingAddr?.addressLine1 ?? "",
        city: billingAddr?.city ?? "",
        state: billingAddr?.state ?? "",
        zip: billingAddr?.postcode ?? "",
        country: billingAddr?.country ?? "",
      },
    };
  }, [order]);

  if (isLoading || !order || !orderHeader) {
    return <OrderViewSkeleton />;
  }

  if (isError) {
    return <div className="p-6">Order not found</div>;
  }

  return (
    <div className="mx-4 space-y-6 xl:mx-64">
      <OrderHeader order={orderHeader} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <OrderItems items={items} />
          <OrderPayment payment={payment} total={order.totalAmount / 100} />
        </div>

        <div className="space-y-6">
          <OrderCustomer
            customer={orderHeader.customer}
            shippingAddress={shipping.address}
            billingAddress={payment.billingAddress}
          />
        </div>
      </div>
    </div>
  );
}
