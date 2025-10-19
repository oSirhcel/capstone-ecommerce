//schemas
import { sql } from "drizzle-orm";
import {
  integer,
  pgTable,
  timestamp,
  varchar,
  boolean,
  text,
  decimal,
  index,
  unique,
  pgEnum,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: varchar("id", { length: 255 }).primaryKey().notNull(),
  username: varchar({ length: 255 }).notNull(),
  password: varchar({ length: 255 }).notNull(),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
});

export const categories = pgTable("categories", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  description: varchar({ length: 500 }),
});

export const stores = pgTable("stores", {
  id: varchar("id", { length: 255 }).primaryKey().notNull(),
  name: varchar({ length: 255 }).unique().notNull(),
  slug: varchar({ length: 255 }).unique().notNull(),
  description: varchar({ length: 1000 }),
  ownerId: varchar("ownerId", { length: 255 })
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp().defaultNow().notNull(),
});

export const productStatusEnum = pgEnum("product_status", [
  "Active",
  "Inactive",
  "Draft",
  "Archived",
]);

export const products = pgTable("products", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  sku: varchar({ length: 50 }).unique(), // Nullable for drafts, unique constraint allows multiple NULLs
  description: varchar({ length: 1000 }),
  price: integer(), // Price in cents - nullable for drafts
  compareAtPrice: integer(), // Compare at price in cents
  costPerItem: integer(), // Cost per item in cents
  stock: integer().notNull().default(0),
  trackQuantity: boolean().notNull().default(true),
  allowBackorders: boolean().notNull().default(false),
  weight: decimal({ precision: 8, scale: 3 }), // Weight in kg
  length: decimal({ precision: 8, scale: 2 }), // Length in cm
  width: decimal({ precision: 8, scale: 2 }), // Width in cm
  height: decimal({ precision: 8, scale: 2 }), // Height in cm
  seoTitle: varchar({ length: 60 }),
  seoDescription: varchar({ length: 160 }),
  slug: varchar({ length: 255 }).unique(),
  status: productStatusEnum().notNull().default("Draft"),
  featured: boolean().notNull().default(false),
  tags: text(), // JSON string of tags array
  storeId: varchar("storeId", { length: 255 })
    .references(() => stores.id)
    .notNull(),
  categoryId: integer().references(() => categories.id),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
});

export const carts = pgTable("carts", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("userId", { length: 255 })
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
});

export const cartItems = pgTable("cart_items", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  cartId: integer()
    .references(() => carts.id)
    .notNull(),
  productId: integer()
    .references(() => products.id)
    .notNull(),
  quantity: integer().notNull().default(1),
});

export const orderStatusEnum = pgEnum("order_status", [
  "Pending",
  "Processing",
  "Shipped",
  "Completed",
  "Cancelled",
  "Refunded",
  "On-hold",
  "Failed",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "Pending",
  "Paid",
  "Failed",
  "Refunded",
]);

export const orders = pgTable("orders", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("userId", { length: 255 })
    .references(() => users.id)
    .notNull(),
  storeId: varchar("storeId", { length: 255 })
    .references(() => stores.id)
    .notNull(), // Orders belong to a specific store
  status: orderStatusEnum().notNull().default("Pending"),
  paymentStatus: paymentStatusEnum().notNull().default("Pending"),
  totalAmount: integer().notNull(), // Total in cents
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
});

export const orderItems = pgTable("order_items", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  orderId: integer()
    .references(() => orders.id)

    .notNull(),
  productId: integer()
    .references(() => products.id)

    .notNull(),
  quantity: integer().notNull(),
  priceAtTime: integer().notNull(), // Price in cents at time of purchase
});

export const reviews = pgTable("reviews", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("userId", { length: 255 })
    .references(() => users.id)
    .notNull(),
  productId: integer()
    .references(() => products.id)
    .notNull(),
  rating: integer().notNull(),
  comment: varchar({ length: 1000 }),
  verifiedPurchase: boolean().notNull().default(false),
  createdAt: timestamp().defaultNow().notNull(),
});

export const wishlists = pgTable("wishlists", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("userId", { length: 255 })
    .references(() => users.id)
    .notNull(),
  productId: integer()
    .references(() => products.id)
    .notNull(),
  createdAt: timestamp().defaultNow().notNull(),
});

// Product images table to handle multiple images per product
export const productImages = pgTable("product_images", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  productId: integer()
    .references(() => products.id)
    .notNull(),
  imageUrl: varchar({ length: 500 }).notNull(), // URL or path to the image
  altText: varchar({ length: 255 }), // Alt text for accessibility
  isPrimary: boolean().notNull().default(false), // Whether this is the main product image
  displayOrder: integer().notNull().default(0), // Order for displaying images
  createdAt: timestamp().defaultNow().notNull(),
});

// User profiles for additional user information
export const userProfiles = pgTable("user_profiles", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("userId", { length: 255 })
    .references(() => users.id)
    .notNull()
    .unique(),
  firstName: varchar({ length: 100 }),
  lastName: varchar({ length: 100 }),
  email: varchar({ length: 255 }).notNull(),
  phone: varchar({ length: 20 }),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
});

// Store-scoped customer profiles for per-store CRM data
export const storeCustomerProfiles = pgTable(
  "store_customer_profiles",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: varchar("userId", { length: 255 })
      .references(() => users.id)
      .notNull(),
    storeId: varchar("storeId", { length: 255 })
      .references(() => stores.id)
      .notNull(),

    status: varchar({ length: 20 }).notNull().default("Active"),
    adminNotes: text(),
    tags: text("tags")
      .array()
      .notNull()
      .default(sql`ARRAY[]::text[]`),

    firstOrderAt: timestamp(),
    lastOrderAt: timestamp(),
    orderCount: integer().notNull().default(0),
    totalSpent: integer().notNull().default(0), //Total spent in cents
    marketingOptIn: timestamp(),

    createdAt: timestamp().defaultNow().notNull(),
    updatedAt: timestamp().defaultNow().notNull(),
  },
  (table) => [
    unique("store_customer_profiles_user_store_unique").on(
      table.userId,
      table.storeId,
    ),
    index("store_customer_profiles_store_idx").on(table.storeId),
    index("store_customer_profiles_user_idx").on(table.userId),
    index("store_customer_profiles_status_idx").on(table.status),
    index("store_customer_profiles_last_order_idx").on(table.lastOrderAt),
  ],
);

export const addressTypesEnum = pgEnum("address_types", [
  "shipping",
  "billing",
]);

// Addresses for shipping and billing
export const addresses = pgTable("addresses", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("userId", { length: 255 })
    .references(() => users.id)
    .notNull(),
  type: addressTypesEnum().notNull(),
  firstName: varchar({ length: 100 }).notNull(),
  lastName: varchar({ length: 100 }).notNull(),
  addressLine1: varchar({ length: 255 }).notNull(),
  addressLine2: varchar({ length: 255 }),
  city: varchar({ length: 100 }).notNull(),
  state: varchar({ length: 100 }).notNull(),
  postcode: varchar({ length: 20 }).notNull(),
  country: varchar({ length: 100 }).notNull(),
  isDefault: boolean().notNull().default(false),
  // Concurrency and lifecycle
  version: integer().notNull().default(1),
  updatedAt: timestamp().defaultNow().notNull(),
  archivedAt: timestamp(),
  createdAt: timestamp().defaultNow().notNull(),
});

// Order address snapshots (normalized, immutable per order)
export const orderAddresses = pgTable("order_addresses", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  orderId: integer()
    .references(() => orders.id)
    .notNull(),
  type: addressTypesEnum().notNull(),
  firstName: varchar({ length: 100 }).notNull(),
  lastName: varchar({ length: 100 }).notNull(),
  addressLine1: varchar({ length: 255 }).notNull(),
  addressLine2: varchar({ length: 255 }),
  city: varchar({ length: 100 }).notNull(),
  state: varchar({ length: 100 }).notNull(),
  postcode: varchar({ length: 20 }).notNull(),
  country: varchar({ length: 100 }).notNull(),
  createdAt: timestamp().defaultNow().notNull(),
});

// Shipping methods and rates
export const shippingMethods = pgTable("shipping_methods", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 100 }).notNull(),
  description: varchar({ length: 500 }),
  basePrice: integer().notNull(), // Price in cents
  estimatedDays: integer().notNull(),
  isActive: boolean().notNull().default(true),
  createdAt: timestamp().defaultNow().notNull(),
});

// Payment methods
export const paymentMethods = pgTable("payment_methods", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("userId", { length: 255 })
    .references(() => users.id)
    .notNull(),
  type: varchar({ length: 50 }).notNull(), // 'credit_card', 'paypal', etc.
  provider: varchar({ length: 100 }).notNull(), // 'visa', 'mastercard', 'paypal'
  lastFourDigits: varchar({ length: 4 }),
  expiryMonth: integer(),
  expiryYear: integer(),
  isDefault: boolean().notNull().default(false),
  isActive: boolean().notNull().default(true),
  createdAt: timestamp().defaultNow().notNull(),
});

// Discounts and coupons
export const discounts = pgTable("discounts", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  code: varchar({ length: 50 }).notNull().unique(),
  name: varchar({ length: 255 }).notNull(),
  description: varchar({ length: 500 }),
  type: varchar({ length: 20 }).notNull(), // 'percentage' or 'fixed'
  value: integer().notNull(), // Percentage (1-100) or fixed amount in cents
  minimumOrderAmount: integer(), // Minimum order amount in cents
  maximumDiscount: integer(), // Maximum discount amount in cents
  usageLimit: integer(), // Total number of times this discount can be used
  usedCount: integer().notNull().default(0),
  isActive: boolean().notNull().default(true),
  validFrom: timestamp().notNull(),
  validUntil: timestamp().notNull(),
  createdAt: timestamp().defaultNow().notNull(),
});

// Order discounts (many-to-many relationship)
export const orderDiscounts = pgTable("order_discounts", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  orderId: integer()
    .references(() => orders.id)
    .notNull(),
  discountId: integer()
    .references(() => discounts.id)
    .notNull(),
  discountAmount: integer().notNull(), // Amount saved in cents
  createdAt: timestamp().defaultNow().notNull(),
});

// Inventory tracking
export const inventoryLogs = pgTable("inventory_logs", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  productId: integer()
    .references(() => products.id)
    .notNull(),
  type: varchar({ length: 50 }).notNull(), // 'purchase', 'sale', 'return', 'adjustment'
  quantity: integer().notNull(), // Positive for additions, negative for subtractions
  reason: varchar({ length: 255 }),
  referenceId: integer(), // Order ID, purchase order ID, etc.
  createdAt: timestamp().defaultNow().notNull(),
});

// Product variants (size, color, etc.)
export const productVariants = pgTable("product_variants", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  productId: integer()
    .references(() => products.id)
    .notNull(),
  name: varchar({ length: 100 }).notNull(), // 'Size', 'Color', etc.
  value: varchar({ length: 100 }).notNull(), // 'Large', 'Red', etc.
  priceAdjustment: integer().notNull().default(0), // Price adjustment in cents
  stock: integer().notNull().default(0),
  sku: varchar({ length: 100 }).unique(),
  isActive: boolean().notNull().default(true),
  createdAt: timestamp().defaultNow().notNull(),
});

// Order shipping information
export const orderShipping = pgTable("order_shipping", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  orderId: integer()
    .references(() => orders.id)
    .notNull()
    .unique(),
  shippingMethodId: integer()
    .references(() => shippingMethods.id)
    .notNull(),
  shippingAddressId: integer()
    .references(() => addresses.id)
    .notNull(),
  trackingNumber: varchar({ length: 100 }),
  shippedAt: timestamp(),
  deliveredAt: timestamp(),
  createdAt: timestamp().defaultNow().notNull(),
});

// Payment transactions
export const paymentTransactions = pgTable("payment_transactions", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  orderId: integer()
    .references(() => orders.id)
    .notNull(),
  paymentMethodId: integer().references(() => paymentMethods.id),
  amount: integer().notNull(), // Amount in cents
  currency: varchar({ length: 3 }).notNull().default("AUD"),
  status: varchar({ length: 50 }).notNull(), // 'pending', 'completed', 'failed', 'refunded'
  transactionId: varchar({ length: 255 }), // External payment processor transaction ID
  gatewayResponse: text(), // JSON response from payment gateway
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
});

// Store settings and configurations
export const storeSettings = pgTable("store_settings", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  storeId: varchar("storeId", { length: 255 })
    .references(() => stores.id)
    .notNull()
    .unique(),
  currency: varchar({ length: 3 }).notNull().default("AUD"),
  taxRate: decimal({ precision: 5, scale: 4 }).notNull().default("0.10"), // Tax rate as decimal (10% GST)
  abn: varchar({ length: 11 }), // Australian Business Number
  businessName: varchar({ length: 255 }),
  contactEmail: varchar({ length: 255 }),
  gstRegistered: boolean().notNull().default(false),
  shippingPolicy: text(),
  returnPolicy: text(),
  privacyPolicy: text(),
  termsOfService: text(),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
});
