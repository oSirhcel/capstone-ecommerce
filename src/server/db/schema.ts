//schemas
import { integer, pgTable, timestamp, varchar, boolean, text, decimal, pgEnum } from "drizzle-orm/pg-core";

// User type enum to define different user roles
export const userTypeEnum = pgEnum("user_type", ["customer", "owner", "admin"]);

export const users = pgTable("users", {
  id: varchar("id", { length: 255 }).primaryKey().notNull(),
  username: varchar({ length: 255 }).notNull(),
  password: varchar({ length: 255 }).notNull(),
  userType: userTypeEnum().notNull().default("customer"), // Default to customer
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull()
});

// NextAuth required tables - minimal additions
export const accounts = pgTable("accounts", {
  id: varchar("id", { length: 255 }).primaryKey().notNull(),
  userId: varchar("userId", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 255 }).notNull(),
  provider: varchar("provider", { length: 255 }).notNull(),
  providerAccountId: varchar("providerAccountId", { length: 255 }).notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: varchar("token_type", { length: 255 }),
  scope: varchar("scope", { length: 255 }),
  id_token: text("id_token"),
  session_state: varchar("session_state", { length: 255 }),
});

export const sessions = pgTable("sessions", {
  sessionToken: varchar("sessionToken", { length: 255 }).primaryKey().notNull(),
  userId: varchar("userId", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable("verification_tokens", {
  identifier: varchar("identifier", { length: 255 }).notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const categories = pgTable("categories", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  description: varchar({ length: 500 })
});

export const stores = pgTable("stores", {
  id: varchar("id", { length: 255 }).primaryKey().notNull(),
  name: varchar({ length: 255 }).notNull(),
  description: varchar({ length: 1000 }),
  ownerId: varchar("ownerId", { length: 255 }).references(() => users.id).notNull(),
  createdAt: timestamp().defaultNow().notNull()
});

export const products = pgTable("products", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  description: varchar({ length: 1000 }),
  price: integer().notNull(), // Price in cents
  stock: integer().notNull().default(0),
  storeId: varchar("storeId", { length: 255 }).references(() => stores.id).notNull(),
  categoryId: integer().references(() => categories.id),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull()
});

export const carts = pgTable("carts", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("userId", { length: 255 }).references(() => users.id).notNull(),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull()
});

export const cartItems = pgTable("cart_items", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  cartId: integer().references(() => carts.id).notNull(),
  productId: integer().references(() => products.id).notNull(),
  quantity: integer().notNull().default(1)
});

export const orders = pgTable("orders", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("userId", { length: 255 }).references(() => users.id).notNull(),
  status: varchar({ length: 50 }).notNull().default('pending'),
  totalAmount: integer().notNull(), // Total in cents
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull()
});

export const orderItems = pgTable("order_items", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  orderId: integer().references(() => orders.id).notNull(),
  productId: integer().references(() => products.id).notNull(),
  quantity: integer().notNull(),
  priceAtTime: integer().notNull() // Price in cents at time of purchase
});

export const reviews = pgTable("reviews", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("userId", { length: 255 }).references(() => users.id).notNull(),
  productId: integer().references(() => products.id).notNull(),
  rating: integer().notNull(),
  comment: varchar({ length: 1000 }),
  createdAt: timestamp().defaultNow().notNull()
});

export const wishlists = pgTable("wishlists", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("userId", { length: 255 }).references(() => users.id).notNull(),
  productId: integer().references(() => products.id).notNull(),
  createdAt: timestamp().defaultNow().notNull()
});

// Product images table to handle multiple images per product
export const productImages = pgTable("product_images", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  productId: integer().references(() => products.id).notNull(),
  imageUrl: varchar({ length: 500 }).notNull(), // URL or path to the image
  altText: varchar({ length: 255 }), // Alt text for accessibility
  isPrimary: boolean().notNull().default(false), // Whether this is the main product image
  displayOrder: integer().notNull().default(0), // Order for displaying images
  createdAt: timestamp().defaultNow().notNull()
});

// User profiles for additional user information
export const userProfiles = pgTable("user_profiles", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("userId", { length: 255 }).references(() => users.id).notNull().unique(),
  firstName: varchar({ length: 100 }),
  lastName: varchar({ length: 100 }),
  email: varchar({ length: 255 }).notNull(),
  phone: varchar({ length: 20 }),
  dateOfBirth: timestamp(),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull()
});

// Addresses for shipping and billing
export const addresses = pgTable("addresses", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("userId", { length: 255 }).references(() => users.id).notNull(),
  type: varchar({ length: 20 }).notNull(), // 'shipping' or 'billing'
  firstName: varchar({ length: 100 }).notNull(),
  lastName: varchar({ length: 100 }).notNull(),
  addressLine1: varchar({ length: 255 }).notNull(),
  addressLine2: varchar({ length: 255 }),
  city: varchar({ length: 100 }).notNull(),
  state: varchar({ length: 100 }).notNull(),
  postalCode: varchar({ length: 20 }).notNull(),
  country: varchar({ length: 100 }).notNull(),
  isDefault: boolean().notNull().default(false),
  createdAt: timestamp().defaultNow().notNull()
});

// Shipping methods and rates
export const shippingMethods = pgTable("shipping_methods", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 100 }).notNull(),
  description: varchar({ length: 500 }),
  basePrice: integer().notNull(), // Price in cents
  estimatedDays: integer().notNull(),
  isActive: boolean().notNull().default(true),
  createdAt: timestamp().defaultNow().notNull()
});

// Payment methods
export const paymentMethods = pgTable("payment_methods", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("userId", { length: 255 }).references(() => users.id).notNull(),
  type: varchar({ length: 50 }).notNull(), // 'credit_card', 'paypal', etc.
  provider: varchar({ length: 100 }).notNull(), // 'visa', 'mastercard', 'paypal'
  lastFourDigits: varchar({ length: 4 }),
  expiryMonth: integer(),
  expiryYear: integer(),
  isDefault: boolean().notNull().default(false),
  isActive: boolean().notNull().default(true),
  createdAt: timestamp().defaultNow().notNull()
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
  createdAt: timestamp().defaultNow().notNull()
});

// Order discounts (many-to-many relationship)
export const orderDiscounts = pgTable("order_discounts", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  orderId: integer().references(() => orders.id).notNull(),
  discountId: integer().references(() => discounts.id).notNull(),
  discountAmount: integer().notNull(), // Amount saved in cents
  createdAt: timestamp().defaultNow().notNull()
});

// Inventory tracking
export const inventoryLogs = pgTable("inventory_logs", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  productId: integer().references(() => products.id).notNull(),
  type: varchar({ length: 50 }).notNull(), // 'purchase', 'sale', 'return', 'adjustment'
  quantity: integer().notNull(), // Positive for additions, negative for subtractions
  reason: varchar({ length: 255 }),
  referenceId: integer(), // Order ID, purchase order ID, etc.
  createdAt: timestamp().defaultNow().notNull()
});

// Product variants (size, color, etc.)
export const productVariants = pgTable("product_variants", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  productId: integer().references(() => products.id).notNull(),
  name: varchar({ length: 100 }).notNull(), // 'Size', 'Color', etc.
  value: varchar({ length: 100 }).notNull(), // 'Large', 'Red', etc.
  priceAdjustment: integer().notNull().default(0), // Price adjustment in cents
  stock: integer().notNull().default(0),
  sku: varchar({ length: 100 }).unique(),
  isActive: boolean().notNull().default(true),
  createdAt: timestamp().defaultNow().notNull()
});

// Order shipping information
export const orderShipping = pgTable("order_shipping", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  orderId: integer().references(() => orders.id).notNull().unique(),
  shippingMethodId: integer().references(() => shippingMethods.id).notNull(),
  shippingAddressId: integer().references(() => addresses.id).notNull(),
  trackingNumber: varchar({ length: 100 }),
  shippedAt: timestamp(),
  deliveredAt: timestamp(),
  createdAt: timestamp().defaultNow().notNull()
});

// Payment transactions
export const paymentTransactions = pgTable("payment_transactions", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  orderId: integer().references(() => orders.id).notNull(),
  paymentMethodId: integer().references(() => paymentMethods.id),
  amount: integer().notNull(), // Amount in cents
  currency: varchar({ length: 3 }).notNull().default('AUD'),
  status: varchar({ length: 50 }).notNull(), // 'pending', 'completed', 'failed', 'refunded'
  transactionId: varchar({ length: 255 }), // External payment processor transaction ID
  gatewayResponse: text(), // JSON response from payment gateway
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull()
});

// Store settings and configurations
export const storeSettings = pgTable("store_settings", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  storeId: varchar("storeId", { length: 255 }).references(() => stores.id).notNull().unique(),
  currency: varchar({ length: 3 }).notNull().default('AUD'),
  taxRate: decimal({ precision: 5, scale: 4 }).notNull().default('0.00'), // Tax rate as decimal
  shippingPolicy: text(),
  returnPolicy: text(),
  privacyPolicy: text(),
  termsOfService: text(),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull()
});