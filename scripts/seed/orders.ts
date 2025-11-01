import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import {
  orders,
  orderItems,
  orderAddresses,
  orderShipping,
  shippingMethods,
  addresses,
  products as productsTable,
} from "../../src/server/db/schema";
import type { InferInsertModel } from "drizzle-orm";
import { inArray } from "drizzle-orm";
import type { SeededUser } from "./users";
import type { SeededStore } from "./stores";
import type { SeededProduct } from "./products";
import type { SeededAddress } from "./addresses";
import { daysAgo, randomInt, cents, randomItem } from "./utils";

type NewOrder = InferInsertModel<typeof orders>;
type NewOrderItem = InferInsertModel<typeof orderItems>;
type NewOrderAddress = InferInsertModel<typeof orderAddresses>;
type NewOrderShipping = InferInsertModel<typeof orderShipping>;

export interface SeededOrder {
  id: number;
  userId: string;
  storeId: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
}

function generateTrackingNumber(): string {
  const prefix = "AUPOST";
  const numbers = String(randomInt(1000000, 9999999));
  return `${prefix}${numbers}`;
}

function getOrderStatus(createdDaysAgo: number): {
  status:
    | "Pending"
    | "Processing"
    | "Shipped"
    | "Completed"
    | "Cancelled"
    | "Refunded"
    | "On-hold"
    | "Failed"
    | "Denied";
  paymentStatus: "Pending" | "Paid" | "Failed" | "Refunded";
} {
  const rand = Math.random();
  const daysSince = createdDaysAgo;

  // Recent orders (0-7 days) - mostly pending/processing
  if (daysSince <= 7) {
    if (rand < 0.4) {
      return { status: "Pending", paymentStatus: "Pending" };
    } else if (rand < 0.7) {
      return { status: "Processing", paymentStatus: "Paid" };
    } else if (rand < 0.85) {
      return { status: "Shipped", paymentStatus: "Paid" };
    } else {
      return { status: "Completed", paymentStatus: "Paid" };
    }
  }

  // Older orders (8-30 days) - mix of shipped and completed
  if (daysSince <= 30) {
    if (rand < 0.05) {
      return { status: "Cancelled", paymentStatus: "Refunded" };
    } else if (rand < 0.1) {
      return { status: "Failed", paymentStatus: "Failed" };
    } else if (rand < 0.2) {
      return { status: "Shipped", paymentStatus: "Paid" };
    } else {
      return { status: "Completed", paymentStatus: "Paid" };
    }
  }

  // Very old orders (31+ days) - mostly completed, some cancelled
  if (rand < 0.08) {
    return { status: "Cancelled", paymentStatus: "Refunded" };
  } else if (rand < 0.1) {
    return { status: "Refunded", paymentStatus: "Refunded" };
  } else {
    return { status: "Completed", paymentStatus: "Paid" };
  }
}

export async function seedOrders(
  db: NodePgDatabase<Record<string, never>>,
  users: SeededUser[],
  stores: SeededStore[],
  products: SeededProduct[],
  userAddresses: SeededAddress[],
): Promise<SeededOrder[]> {
  console.log("🌱 Seeding orders...");

  // Only customers can place orders
  const customers = users.filter((u) => u.role === "customer");
  const seededOrders: SeededOrder[] = [];

  // Group products by store
  const productsByStore = new Map<string, SeededProduct[]>();
  for (const product of products) {
    if (!productsByStore.has(product.storeId)) {
      productsByStore.set(product.storeId, []);
    }
    productsByStore.get(product.storeId)!.push(product);
  }

  // Get user addresses map
  const addressesByUser = new Map<string, SeededAddress[]>();
  for (const addr of userAddresses) {
    if (!addressesByUser.has(addr.userId)) {
      addressesByUser.set(addr.userId, []);
    }
    addressesByUser.get(addr.userId)!.push(addr);
  }

  // Fetch full address details for snapshot
  const addressIds = userAddresses.map((a) => a.id);
  const fullAddresses =
    addressIds.length > 0
      ? await db
          .select()
          .from(addresses)
          .where(inArray(addresses.id, addressIds))
      : [];
  const addressMap = new Map(fullAddresses.map((a) => [a.id, a]));

  // Fetch shipping methods by store
  const shippingMethodsData = await db.select().from(shippingMethods);
  const shippingMethodsByStore = new Map<string, typeof shippingMethodsData>();
  for (const method of shippingMethodsData) {
    if (method.storeId) {
      if (!shippingMethodsByStore.has(method.storeId)) {
        shippingMethodsByStore.set(method.storeId, []);
      }
      shippingMethodsByStore.get(method.storeId)!.push(method);
    }
  }

  // Create orders: 30-60% of customers have placed orders
  const customersWithOrders = customers.slice(
    0,
    Math.floor((customers.length * randomInt(30, 60)) / 100),
  );

  // Fetch all product prices once
  const productIds = products.map((p) => p.id);
  const productPrices =
    productIds.length > 0
      ? await db
          .select({ id: productsTable.id, price: productsTable.price })
          .from(productsTable)
          .where(inArray(productsTable.id, productIds))
      : [];
  const priceMap = new Map(productPrices.map((p) => [p.id, p.price ?? 0]));

  // Prepare order data structures
  interface OrderData {
    customer: SeededUser;
    store: SeededStore;
    selectedProducts: SeededProduct[];
    items: Array<{
      product: SeededProduct;
      quantity: number;
      priceAtTime: number;
    }>;
    totalAmount: number;
    createdDaysAgo: number;
    createdAt: Date;
    status:
      | "Pending"
      | "Processing"
      | "Shipped"
      | "Completed"
      | "Cancelled"
      | "Refunded"
      | "On-hold"
      | "Failed"
      | "Denied";
    paymentStatus: "Pending" | "Paid" | "Failed" | "Refunded";
  }

  const orderDataList: OrderData[] = [];

  // Build order data
  for (const customer of customersWithOrders) {
    // Each customer places 1-5 orders
    const orderCount = randomInt(1, 5);

    for (let i = 0; i < orderCount; i++) {
      // Select a random store
      const store = randomItem(stores);
      const storeProducts = productsByStore.get(store.id) ?? [];

      if (storeProducts.length === 0) continue;

      // Select 1-4 products from this store
      const selectedProducts = storeProducts
        .sort(() => 0.5 - Math.random())
        .slice(0, randomInt(1, Math.min(4, storeProducts.length)));

      if (selectedProducts.length === 0) continue;

      // Calculate order total
      let totalAmount = 0;
      const items: Array<{
        product: SeededProduct;
        quantity: number;
        priceAtTime: number;
      }> = [];

      for (const product of selectedProducts) {
        const quantity = randomInt(1, 3);
        const priceAtTime = priceMap.get(product.id) ?? product.price ?? 0;
        totalAmount += priceAtTime * quantity;
        items.push({ product, quantity, priceAtTime });
      }

      // Add shipping cost (estimate 500-1500 cents = $5-15)
      const shippingCost = cents(randomInt(5, 15));
      totalAmount += shippingCost;

      // Order created 1-180 days ago
      const createdDaysAgo = randomInt(1, 180);
      const createdAt = daysAgo(createdDaysAgo);
      const { status, paymentStatus } = getOrderStatus(createdDaysAgo);

      orderDataList.push({
        customer,
        store,
        selectedProducts,
        items,
        totalAmount,
        createdDaysAgo,
        createdAt,
        status,
        paymentStatus,
      });
    }
  }

  // Batch insert orders
  const batchSize = 100;
  const orderInserts: NewOrder[] = [];
  const orderItemsInserts: NewOrderItem[] = [];
  const orderAddressesInserts: NewOrderAddress[] = [];
  const orderShippingInserts: NewOrderShipping[] = [];

  // Create order inserts
  for (const orderData of orderDataList) {
    orderInserts.push({
      userId: orderData.customer.id,
      storeId: orderData.store.id,
      status: orderData.status,
      paymentStatus: orderData.paymentStatus,
      totalAmount: orderData.totalAmount,
      createdAt: orderData.createdAt,
      updatedAt: orderData.createdAt,
    });
  }

  // Insert orders in batches
  for (let i = 0; i < orderInserts.length; i += batchSize) {
    const batch = orderInserts.slice(i, i + batchSize);
    const insertedOrders = await db.insert(orders).values(batch).returning();

    // Process each order to create items and addresses
    for (let j = 0; j < insertedOrders.length; j++) {
      const order = insertedOrders[j];
      const orderData = orderDataList[i + j];

      // Create order items
      for (const item of orderData.items) {
        orderItemsInserts.push({
          orderId: order.id,
          productId: item.product.id,
          quantity: item.quantity,
          priceAtTime: item.priceAtTime,
        });
      }

      // Create order addresses (snapshot)
      const customerAddresses =
        addressesByUser.get(orderData.customer.id) ?? [];
      if (customerAddresses.length > 0) {
        const shippingAddress = customerAddresses[0];
        const fullAddress = addressMap.get(shippingAddress.id);

        if (fullAddress) {
          // Shipping address
          orderAddressesInserts.push({
            orderId: order.id,
            type: "shipping",
            firstName: fullAddress.firstName ?? "",
            lastName: fullAddress.lastName ?? "",
            addressLine1: fullAddress.addressLine1,
            addressLine2: fullAddress.addressLine2 ?? null,
            city: fullAddress.city,
            state: fullAddress.state,
            postcode: fullAddress.postcode,
            country: fullAddress.country,
            createdAt: order.createdAt,
          });

          // Billing address (usually same as shipping)
          if (Math.random() < 0.9) {
            // 90% same as shipping
            orderAddressesInserts.push({
              orderId: order.id,
              type: "billing",
              firstName: fullAddress.firstName ?? "",
              lastName: fullAddress.lastName ?? "",
              addressLine1: fullAddress.addressLine1,
              addressLine2: fullAddress.addressLine2 ?? null,
              city: fullAddress.city,
              state: fullAddress.state,
              postcode: fullAddress.postcode,
              country: fullAddress.country,
              createdAt: order.createdAt,
            });
          } else if (customerAddresses.length > 1) {
            // 10% different billing address
            const billingAddress = customerAddresses[1];
            const fullBillingAddress = addressMap.get(billingAddress.id);
            if (fullBillingAddress) {
              orderAddressesInserts.push({
                orderId: order.id,
                type: "billing",
                firstName: fullBillingAddress.firstName ?? "",
                lastName: fullBillingAddress.lastName ?? "",
                addressLine1: fullBillingAddress.addressLine1,
                addressLine2: fullBillingAddress.addressLine2 ?? null,
                city: fullBillingAddress.city,
                state: fullBillingAddress.state,
                postcode: fullBillingAddress.postcode,
                country: fullBillingAddress.country,
                createdAt: order.createdAt,
              });
            }
          }

          // Create order shipping if shipping methods exist for this store
          const storeShippingMethods =
            shippingMethodsByStore.get(orderData.store.id) ?? [];
          if (
            storeShippingMethods.length > 0 &&
            order.status !== "Pending" &&
            order.status !== "Cancelled"
          ) {
            const shippingMethod = randomItem(storeShippingMethods);
            const estimatedDays = shippingMethod.estimatedDays;
            const shippedAt =
              order.status === "Shipped" || order.status === "Completed"
                ? daysAgo(
                    orderData.createdDaysAgo - randomInt(1, estimatedDays),
                  )
                : null;
            const deliveredAt =
              order.status === "Completed"
                ? daysAgo(orderData.createdDaysAgo - randomInt(0, 3))
                : null;

            orderShippingInserts.push({
              orderId: order.id,
              shippingMethodId: shippingMethod.id,
              shippingAddressId: shippingAddress.id,
              trackingNumber:
                shippedAt ||
                order.status === "Shipped" ||
                order.status === "Completed"
                  ? generateTrackingNumber()
                  : null,
              shippedAt,
              deliveredAt,
              createdAt: order.createdAt,
            });
          }
        }
      }

      seededOrders.push({
        id: order.id,
        userId: order.userId,
        storeId: order.storeId ?? "",
        status: order.status,
        paymentStatus: order.paymentStatus,
        totalAmount: order.totalAmount,
      });
    }
  }

  // Batch insert order items
  if (orderItemsInserts.length > 0) {
    const itemsBatchSize = 200;
    for (let i = 0; i < orderItemsInserts.length; i += itemsBatchSize) {
      const batch = orderItemsInserts.slice(i, i + itemsBatchSize);
      await db.insert(orderItems).values(batch);
    }
  }

  // Batch insert order addresses
  if (orderAddressesInserts.length > 0) {
    const addressesBatchSize = 200;
    for (let i = 0; i < orderAddressesInserts.length; i += addressesBatchSize) {
      const batch = orderAddressesInserts.slice(i, i + addressesBatchSize);
      await db.insert(orderAddresses).values(batch);
    }
  }

  // Batch insert order shipping
  if (orderShippingInserts.length > 0) {
    const shippingBatchSize = 200;
    for (let i = 0; i < orderShippingInserts.length; i += shippingBatchSize) {
      const batch = orderShippingInserts.slice(i, i + shippingBatchSize);
      await db.insert(orderShipping).values(batch);
    }
  }

  console.log(`✅ Created ${seededOrders.length} orders`);
  console.log(`   - For ${customersWithOrders.length} customers`);
  console.log(`   - ${orderItemsInserts.length} order items`);
  console.log(`   - ${orderAddressesInserts.length} order addresses`);
  console.log(`   - ${orderShippingInserts.length} shipping records`);

  return seededOrders;
}
