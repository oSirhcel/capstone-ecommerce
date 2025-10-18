import { getBaseUrl } from "./config";
import type { StoreGroup } from "@/contexts/cart-context";

export type OrderItemDTO = {
  id: number;
  productId: number;
  productName?: string | null;
  quantity: number;
  priceAtTime: number; // cents
};

export type OrderDTO = {
  id: number;
  status: string;
  totalAmount: number; // cents
  createdAt: string;
  updatedAt: string;
  items: OrderItemDTO[];
};

export type AddressData = {
  id?: number;
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  isDefault?: boolean;
};

export type ContactData = {
  email: string;
  phone: string;
};

export type CreateOrderPayload = {
  items: Array<{
    productId: number;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  contactData: ContactData;
  storeId: string;
  shippingAddress: AddressData;
  billingAddress: AddressData;
};

export type CreateOrdersResult = {
  orderIds: number[];
  primaryOrderId: number;
  storeCount: number;
};

export async function fetchOrders(params?: {
  page?: number;
  limit?: number;
}): Promise<{
  orders: OrderDTO[];
  pagination: { page: number; limit: number; hasMore: boolean };
}> {
  const base = getBaseUrl();
  const url = new URL("/api/orders", base);
  if (params?.page) url.searchParams.set("page", String(params.page));
  if (params?.limit) url.searchParams.set("limit", String(params.limit));
  const res = await fetch(url.toString(), { credentials: "include" });
  if (!res.ok) throw new Error(`Failed to fetch orders: ${res.status}`);
  return (await res.json()) as {
    orders: OrderDTO[];
    pagination: { page: number; limit: number; hasMore: boolean };
  };
}

export async function fetchOrderById(id: number): Promise<{ order: OrderDTO }> {
  const base = getBaseUrl();
  const url = new URL("/api/orders", base);
  url.searchParams.set("id", String(id));
  const res = await fetch(url.toString(), { credentials: "include" });
  if (!res.ok) throw new Error(`Failed to fetch order ${id}: ${res.status}`);
  return (await res.json()) as { order: OrderDTO };
}

export async function createOrders(
  storeGroups: StoreGroup[],
  contactData: ContactData,
  shippingAddress: AddressData,
  billingAddress: AddressData,
  shipping: number,
  tax: number,
): Promise<CreateOrdersResult> {
  const orderPromises = storeGroups.map(async (storeGroup) => {
    const storeTotal =
      storeGroup.subtotal +
      shipping / storeGroups.length +
      tax / storeGroups.length;

    const orderPayload: CreateOrderPayload = {
      items: storeGroup.items.map((item) => ({
        productId:
          typeof item.id === "string"
            ? parseInt((item.id as unknown as string) || "", 10)
            : item.id,
        quantity: item.quantity,
        price: item.price,
      })),
      totalAmount: Math.round(storeTotal * 100), // Convert to cents
      contactData,
      storeId: storeGroup.storeId,
      shippingAddress,
      billingAddress,
    };

    const response = await fetch("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderPayload),
    });

    if (!response.ok) {
      let serverMessage = "Failed to create order";
      try {
        const err = (await response.json()) as { error?: string };
        if (err?.error) serverMessage = err.error;
      } catch {
        // Ignore JSON parsing errors
      }
      throw new Error(serverMessage);
    }

    const orderData = (await response.json()) as { orderId: number };
    return {
      orderId: orderData.orderId,
      storeId: storeGroup.storeId,
      storeName: storeGroup.storeName,
    };
  });

  // Wait for all orders to be created
  const createdOrders = await Promise.all(orderPromises);

  // Return the first order ID for payment processing
  // (Stripe will handle the payment for the total amount)
  return {
    orderIds: createdOrders.map((o) => o.orderId),
    primaryOrderId: createdOrders[0].orderId,
    storeCount: createdOrders.length,
  };
}
