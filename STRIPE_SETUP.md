# Stripe Payment Integration Setup Guide

## Overview

This guide will help you set up Stripe payments for your e-commerce application. The integration includes payment processing, transaction recording, webhooks, and a complete checkout flow.

## Prerequisites

- Stripe account (https://stripe.com)
- PostgreSQL database configured
- NextAuth.js authentication working

## Step 1: Get Stripe Credentials

1. **Create a Stripe account** at https://stripe.com
2. **Navigate to API Keys** in your Stripe Dashboard
3. **Copy your keys**:
   - `Publishable key` (starts with `pk_test_` or `pk_live_`)
   - `Secret key` (starts with `sk_test_` or `sk_live_`)

## Step 2: Environment Variables

Add these to your `.env.local` file:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY="sk_test_your_secret_key_here"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_your_publishable_key_here"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret_here"

# Stripe Connect (for multi-store payments)
STRIPE_CLIENT_ID="ca_your_client_id_here"
```

### Getting Your Stripe Client ID (for Stripe Connect)

1. **Log in to Stripe Dashboard** at https://dashboard.stripe.com
2. **Navigate to**: Settings → Connect → Settings
3. **Find "Client ID"** - it starts with `ca_`
4. **Copy the Client ID** and add it to your `.env.local` file

**Note**: The Client ID is different from your API keys. It's specifically used for Stripe Connect OAuth flows.

### Configuring Redirect URIs (Required)

After getting your Client ID, you must configure the redirect URI in Stripe:

1. **In Stripe Dashboard**, go to: Settings → Connect → Settings
2. **Scroll down to "Redirect URIs"** section
3. **Add your redirect URI**:
   - **For local development**: `http://localhost:3000/api/admin/settings/payments/stripe/callback`
   - **For production**: `https://yourdomain.com/api/admin/settings/payments/stripe/callback`
4. **Click "Add"** to save

**Important**: The redirect URI must match exactly (including `http://` vs `https://` and the port number). If you're using a custom port or domain, make sure it matches your `NEXT_PUBLIC_APP_URL` or `NEXTAUTH_URL` environment variable.

## Step 3: Set Up Webhooks (Local Development)

For local development, you **cannot** use localhost URLs directly. Instead, use the Stripe CLI:

### Install Stripe CLI

**macOS (Homebrew):**

```bash
brew install stripe/stripe-cli/stripe
```

**Windows:**
Download from: https://github.com/stripe/stripe-cli/releases

**Linux:**

```bash
wget -O stripe.tar.gz https://github.com/stripe/stripe-cli/releases/latest/download/stripe_*_linux_x86_64.tar.gz
tar -xzf stripe.tar.gz
sudo mv stripe /usr/local/bin/
```

### Authenticate with Stripe

```bash
stripe login
```

This will open your browser to authenticate with your Stripe account.

### Forward Webhooks to Your Local Server

```bash
stripe listen --forward-to localhost:3000/api/payments/webhooks
```

**Important:** Keep this command running while developing. It will:

1. Forward webhook events to your local server
2. Display a webhook signing secret like `whsec_xxx...`
3. Show real-time webhook events in your terminal

### Update Environment Variables

Copy the webhook signing secret from the CLI output and add it to your `.env.local`:

```bash
STRIPE_WEBHOOK_SECRET="whsec_xxxxxxxxxxxxx"
```

### Test Webhooks

The Stripe CLI will now forward these events to your local app:

- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `payment_intent.processing`
- `payment_intent.canceled`
- `payment_method.attached`
- `customer.created`

## Step 3b: Production Webhooks (When Ready to Deploy)

For production, you'll create webhooks in the Stripe Dashboard:

1. **Go to Stripe Dashboard** → Webhooks
2. **Add endpoint**: `https://yourdomain.com/api/payments/webhooks`
3. **Select these events**:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.processing`
   - `payment_intent.canceled`
   - `payment_method.attached`
   - `customer.created`
4. **Copy the webhook secret** and add it to your production environment variables

## Step 4: Database Schema

The required tables are already in your schema:

- `payment_methods` - User saved payment methods
- `payment_transactions` - Payment transaction records
- `orders` - Order information
- `order_items` - Items in each order

Run database migrations if needed:

```bash
npm run db:push
```

### Quick Start (Now that CLI is installed)

You're ready to test! Follow these steps:

1. **Authenticate with Stripe:**

   ```bash
   stripe login
   ```

   This will open your browser to log into your Stripe account.

2. **Start your development server:**

   ```bash
   npm run dev
   ```

3. **In a new terminal, start webhook forwarding:**

   ```bash
   stripe listen --forward-to localhost:3000/api/payments/webhooks
   ```

   Copy the webhook secret (`whsec_...`) from this output.

4. **Add the webhook secret to your `.env.local`:**

   ```bash
   STRIPE_WEBHOOK_SECRET="whsec_your_secret_here"
   ```

5. **Test a payment** using card `4242 4242 4242 4242`

## Step 5: Detailed Testing Guide

1. **Start your development server**:

   ```bash
   npm run dev
   ```

2. **Start Stripe CLI webhook forwarding** (in a separate terminal):

   ```bash
   stripe listen --forward-to localhost:3000/api/payments/webhooks
   ```

3. **Add items to cart** and go to checkout

4. **Use Stripe test cards**:
   - **Success**: `4242 4242 4242 4242`
   - **Decline**: `4000 0000 0000 0002`
   - **Requires authentication**: `4000 0000 0000 3220`
   - Use any future expiry date, any CVC

5. **Watch webhook events** in your Stripe CLI terminal to see real-time payment updates

## Features Included

### Payment Processing

- Secure payment form with Stripe Elements
- Support for credit cards and Australian bank debits
- Real-time payment validation

### Database Integration

- Automatic transaction recording
- Order status updates
- Payment method saving (optional)

### Multi-step Checkout

- Contact information collection
- Shipping address form
- Payment processing
- Success confirmation

### Webhook Handling

- Automatic payment status updates
- Order confirmation on successful payment
- Failed payment handling

### Error Handling

- Payment failures
- Network errors
- User-friendly error messages

## API Endpoints

- `POST /api/payments` - Create payment intent
- `PUT /api/payments` - Confirm payment
- `GET /api/payments` - Get payment status
- `POST /api/payments/methods` - Save payment method
- `GET /api/payments/methods` - Get saved payment methods
- `DELETE /api/payments/methods` - Delete payment method
- `POST /api/payments/webhooks` - Handle Stripe webhooks
- `POST /api/orders` - Create order

## Security Features

- Server-side payment intent creation
- Webhook signature verification
- User authentication required
- Secure credential handling

## Testing Checklist

- [ ] Can create payment intent
- [ ] Payment form displays correctly
- [ ] Test card payments work
- [ ] Failed payments handled gracefully
- [ ] Webhooks update order status
- [ ] Order confirmation page works
- [ ] Database records transactions correctly

## Production Deployment

1. **Replace test keys** with live Stripe keys
2. **Update webhook endpoint** to your production domain
3. **Enable only necessary webhook events**
4. **Set up monitoring** for failed payments
5. **Test thoroughly** with real bank account

## Troubleshooting

### Common Issues

1. **"Invalid API Key"**
   - Check your `.env.local` file
   - Ensure keys don't have extra spaces
   - Restart development server

2. **"No application matches the supplied client identifier"**
   - This error occurs when connecting Stripe accounts
   - Ensure `STRIPE_CLIENT_ID` is set in your `.env.local` file
   - Get your Client ID from Stripe Dashboard → Settings → Connect → Settings
   - The Client ID starts with `ca_` (not `sk_` or `pk_`)
   - Restart your development server after adding the variable

3. **"Invalid redirect URI"**
   - This error means the redirect URI doesn't match what's configured in Stripe
   - Go to Stripe Dashboard → Settings → Connect → Settings → Redirect URIs
   - Add the exact redirect URI: `http://localhost:3000/api/admin/settings/payments/stripe/callback` (for local dev)
   - For production, use: `https://yourdomain.com/api/admin/settings/payments/stripe/callback`
   - Make sure the URI matches exactly (including protocol and port)
   - The redirect URI is automatically generated from your `NEXT_PUBLIC_APP_URL` or `NEXTAUTH_URL` environment variable

4. **Webhook signature verification failed**
   - Check webhook secret in `.env.local`
   - Ensure webhook endpoint is correct

5. **Payment form not loading**
   - Check browser console for errors
   - Verify publishable key is set
   - Ensure Stripe Elements are loading

6. **Database errors**
   - Run `npm run db:push` to update schema
   - Check database connection

### Debug Mode

Enable debug logging by adding to your `.env.local`:

```bash
DEBUG=stripe:*
```

## Support

- Stripe Documentation: https://stripe.com/docs
- Stripe Support: https://support.stripe.com
- Test Cards: https://stripe.com/docs/testing

---

## Architecture Overview

```
Frontend (Next.js)
├── Checkout Form (Multi-step)
├── Stripe Elements (Payment UI)
└── Success Page

Backend (API Routes)
├── /api/payments (Payment processing)
├── /api/payments/methods (Payment methods)
├── /api/payments/webhooks (Stripe events)
└── /api/orders (Order management)

Database (PostgreSQL)
├── payment_transactions
├── payment_methods
├── orders
└── order_items

External Services
├── Stripe (Payment processing)
└── Webhooks (Event handling)
```

The payment flow is secure, scalable, and production-ready!
