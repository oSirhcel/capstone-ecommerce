import Stripe from "stripe";

// Initialize Stripe with secret key
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil",
});

// Stripe configuration
export const stripeConfig = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  currency: "aud", // Australian Dollar
  country: "AU",
};

// Payment method types we support
export const supportedPaymentMethods = [
  "card",
  "au_becs_debit", // Australian bank debits
] as const;

// Convert amount to cents (Stripe requires amounts in smallest currency unit)
export const formatAmountForStripe = (amount: number): number => {
  return Math.round(amount * 100);
};

// Convert cents back to dollars for display
export const formatAmountFromStripe = (amount: number): number => {
  return amount / 100;
};

// Create a payment intent
export const createPaymentIntent = async (params: {
  amount: number;
  currency?: string;
  customerId?: string;
  paymentMethodId?: string;
  metadata?: Record<string, string>;
  stripeAccountId?: string; // Stripe Connect account ID
  transferData?: {
    destination: string; // Connected account ID
    amount?: number; // Amount to transfer in cents
  };
}) => {
  const {
    amount,
    currency = stripeConfig.currency,
    customerId,
    paymentMethodId,
    metadata = {},
    stripeAccountId,
    transferData,
  } = params;

  const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
    amount: formatAmountForStripe(amount),
    currency,
    automatic_payment_methods: {
      enabled: true,
    },
    metadata,
  };

  if (customerId) {
    paymentIntentParams.customer = customerId;
  }

  if (paymentMethodId) {
    paymentIntentParams.payment_method = paymentMethodId;
  }

  if (transferData) {
    paymentIntentParams.transfer_data = {
      destination: transferData.destination,
      ...(transferData.amount !== undefined && { amount: transferData.amount }),
    };
  }

  // Use Stripe Connect if account ID provided
  const options: Stripe.RequestOptions = stripeAccountId
    ? { stripeAccount: stripeAccountId }
    : {};

  return stripe.paymentIntents.create(paymentIntentParams, options);
};

// Create or retrieve a Stripe customer
export const createOrRetrieveCustomer = async (params: {
  userId: string;
  email?: string;
  name?: string;
  stripeAccountId?: string; // Stripe Connect account ID
}) => {
  const { userId, email, name, stripeAccountId } = params;

  const options: Stripe.RequestOptions = stripeAccountId
    ? { stripeAccount: stripeAccountId }
    : {};

  // First, try to find existing customer by userId in metadata
  try {
    const searchResults = await stripe.customers.search(
      {
        query: `metadata['userId']:'${userId}'`,
        limit: 1,
      },
      options,
    );

    if (searchResults.data.length > 0) {
      return searchResults.data[0];
    }
  } catch (error) {
    console.warn("Stripe customer search failed, falling back to list:", error);

    // Fallback to list method if search fails
    const existingCustomers = await stripe.customers.list(
      {
        limit: 100, // Increase limit for better chance of finding customer
      },
      options,
    );

    // Search through customers to find one with matching userId
    for (const customer of existingCustomers.data) {
      if (customer.metadata?.userId === userId) {
        return customer;
      }
    }
  }

  // If we have an email and no existing customer found, search by email
  if (email) {
    const emailCustomers = await stripe.customers.list(
      {
        limit: 1,
        email: email,
      },
      options,
    );

    if (emailCustomers.data.length > 0) {
      // Update the customer with our userId metadata
      return stripe.customers.update(
        emailCustomers.data[0].id,
        {
          metadata: {
            userId,
          },
        },
        options,
      );
    }
  }

  // Create new customer
  const customerData: Stripe.CustomerCreateParams = {
    metadata: {
      userId,
    },
  };

  // Only add email if it's provided and valid
  if (email) {
    customerData.email = email;
  }

  // Only add name if it's provided
  if (name) {
    customerData.name = name;
  }

  return stripe.customers.create(customerData, options);
};

// Save payment method to customer
export const savePaymentMethod = async (params: {
  customerId: string;
  paymentMethodId: string;
  stripeAccountId?: string; // Stripe Connect account ID
}) => {
  const { customerId, paymentMethodId, stripeAccountId } = params;

  const options: Stripe.RequestOptions = stripeAccountId
    ? { stripeAccount: stripeAccountId }
    : {};

  return stripe.paymentMethods.attach(
    paymentMethodId,
    {
      customer: customerId,
    },
    options,
  );
};

// Get customer's payment methods
export const getCustomerPaymentMethods = async (
  customerId: string,
  stripeAccountId?: string, // Stripe Connect account ID
) => {
  const options: Stripe.RequestOptions = stripeAccountId
    ? { stripeAccount: stripeAccountId }
    : {};

  return stripe.paymentMethods.list(
    {
      customer: customerId,
      type: "card",
    },
    options,
  );
};

// Confirm payment intent
export const confirmPaymentIntent = async (
  paymentIntentId: string,
  paymentMethodId?: string,
  stripeAccountId?: string, // Stripe Connect account ID
) => {
  const updateParams: Stripe.PaymentIntentUpdateParams = {};

  if (paymentMethodId) {
    updateParams.payment_method = paymentMethodId;
  }

  const options: Stripe.RequestOptions = stripeAccountId
    ? { stripeAccount: stripeAccountId }
    : {};

  return stripe.paymentIntents.confirm(paymentIntentId, updateParams, options);
};

// Handle webhook events
export const constructWebhookEvent = (
  payload: string | Buffer,
  signature: string,
) => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
};
