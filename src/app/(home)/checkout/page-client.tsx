"use client";

import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/cart-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CreditCard, Mail, Plus, Package } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { Breadcrumb } from "@/components/product/breadcrumb";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Form, FormControl, FormField } from "@/components/ui/form";
import { Field, FieldLabel } from "@/components/ui/field";
import { toast } from "sonner";
import { StripePaymentForm } from "@/components/checkout/stripe-payment-form";
import { AddressForm } from "@/components/checkout/address-form";
import { useAddressesByType } from "@/hooks/use-addresses";
import { createOrders as createOrdersAPI } from "@/lib/api/orders";

// Form schemas
const contactFormSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .max(255, "Email is too long"),
  phone: z
    .string()
    .min(1, "Phone number is required")
    .regex(
      /^[\d\s\-\+\(\)]+$/,
      "Please enter a valid phone number (digits, spaces, +, -, or parentheses only)",
    )
    .min(8, "Phone number must be at least 8 digits")
    .max(20, "Phone number is too long"),
});

const addressFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  addressLine1: z.string().min(3, "Address is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  postcode: z.string().min(2, "Postcode is required"),
  country: z.string().min(2, "Country is required"),
  isDefault: z.boolean().default(false),
});

type ContactFormData = z.infer<typeof contactFormSchema>;
type AddressFormData = {
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  isDefault: boolean;
};

export function CheckoutClient() {
  const { data: session } = useSession();
  const router = useRouter();
  const {
    items,
    isLoading,
    error,
    storeGroups,
    getStoreCount,
    subtotal,
    clearCart,
  } = useCart();

  const [currentStep, setCurrentStep] = useState<"address" | "payment">(
    "address",
  );
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);

  const {
    addresses: shippingAddresses,
    defaultAddress: defaultShipping,
    isLoading: loadingShipping,
  } = useAddressesByType("shipping");
  const {
    addresses: billingAddresses,
    defaultAddress: defaultBilling,
    isLoading: loadingBilling,
  } = useAddressesByType("billing");

  // Form instances
  const contactForm = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      email: session?.user?.email ?? "",
      phone: "",
    },
  });

  const shippingForm = useForm<AddressFormData>({
    resolver: zodResolver(addressFormSchema) as Resolver<AddressFormData>,
    defaultValues: {
      firstName: "",
      lastName: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      postcode: "",
      country: "Australia",
      isDefault: false,
    },
  });

  const billingForm = useForm<AddressFormData>({
    resolver: zodResolver(addressFormSchema) as Resolver<AddressFormData>,
    defaultValues: {
      firstName: "",
      lastName: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      postcode: "",
      country: "Australia",
      isDefault: false,
    },
  });

  // Address selection state
  const [selectedShippingId, setSelectedShippingId] = useState<number | null>(
    defaultShipping?.id ?? null,
  );
  const [selectedBillingId, setSelectedBillingId] = useState<number | null>(
    defaultBilling?.id ?? null,
  );
  const [sameAsShipping, setSameAsShipping] = useState(true);

  // Handle shipping address selection
  const handleShippingAddressSelect = (addressId: number) => {
    const address = shippingAddresses.find((a) => a.id === addressId);
    if (address) {
      setSelectedShippingId(addressId);
      shippingForm.reset({
        firstName: address.firstName,
        lastName: address.lastName,
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2 ?? "",
        city: address.city,
        state: address.state,
        postcode: address.postcode,
        country: address.country,
        isDefault: address.isDefault,
      });
    }
  };

  // Handle billing address selection
  const handleBillingAddressSelect = (addressId: number) => {
    const address = billingAddresses.find((a) => a.id === addressId);
    if (address) {
      setSelectedBillingId(addressId);
      billingForm.reset({
        firstName: address.firstName,
        lastName: address.lastName,
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2 ?? "",
        city: address.city,
        state: address.state,
        postcode: address.postcode,
        country: address.country,
        isDefault: address.isDefault,
      });
    }
  };

  // Handle same as shipping toggle
  const handleSameAsShippingChange = (checked: boolean) => {
    setSameAsShipping(checked);
    if (checked) {
      setSelectedBillingId(null);
      const shippingData = shippingForm.getValues();
      billingForm.reset(shippingData);
    }
  };

  // Redirect to login if not authenticated
  if (!session) {
    return (
      <div className="bg-background min-h-screen">
        <div className="container mx-auto px-4 py-12 md:px-6">
          <div className="text-center">
            <CreditCard className="text-muted-foreground mx-auto h-12 w-12" />
            <h1 className="mt-4 text-2xl font-bold">Please Sign In</h1>
            <p className="text-muted-foreground mt-2">
              You need to be signed in to proceed to checkout.
            </p>
            <Button asChild className="mt-4">
              <Link href="/auth/signin">Sign In</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading || loadingShipping || loadingBilling) {
    return (
      <div className="bg-background min-h-screen">
        <div className="container mx-auto px-4 py-8 md:px-6">
          <div className="mb-6">
            <Skeleton className="h-8 w-48" />
          </div>
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <Skeleton className="h-64 w-full" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-background min-h-screen">
        <div className="container mx-auto px-4 py-12 md:px-6">
          <div className="text-center text-red-600">
            <h1 className="text-2xl font-bold">Error Loading Checkout</h1>
            <p className="mt-2">
              Failed to load checkout information. Please try again.
            </p>
            <Button asChild className="mt-4">
              <Link href="/cart">Return to Cart</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-background min-h-screen">
        <div className="container mx-auto px-4 py-12 md:px-6">
          <div className="text-center">
            <CreditCard className="text-muted-foreground mx-auto h-12 w-12" />
            <h1 className="mt-4 text-2xl font-bold">Your Cart is Empty</h1>
            <p className="text-muted-foreground mt-2">
              Add some items to your cart to proceed to checkout.
            </p>
            <Button asChild className="mt-4">
              <Link href="/">Continue Shopping</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate shipping, tax, and total
  const shipping = subtotal > 50 ? 0 : 5.99;
  const tax = subtotal * 0.1; // 10% GST for Australia
  const total = subtotal + shipping + tax;

  // Validate address step and proceed to payment
  const handleProceedToPayment = async () => {
    // Validate contact form
    const contactValid = await contactForm.trigger();
    if (!contactValid) {
      toast.error("Please complete your contact information", {
        description: "Email and phone number are required",
      });
      return;
    }

    // Validate shipping address
    const shippingValid = selectedShippingId
      ? true
      : await shippingForm.trigger();
    if (!shippingValid) {
      toast.error("Please complete your shipping address", {
        description: "All required shipping fields must be filled",
      });
      return;
    }

    // Validate billing address if not same as shipping
    if (!sameAsShipping) {
      const billingValid = selectedBillingId
        ? true
        : await billingForm.trigger();
      if (!billingValid) {
        toast.error("Please complete your billing address", {
          description: "All required billing fields must be filled",
        });
        return;
      }
    }

    setCurrentStep("payment");
  };

  const handleCreateOrders = async (riskAssessmentId?: number) => {
    try {
      // Get form data
      const contactData = contactForm.getValues();
      const shippingData = shippingForm.getValues();
      const billingData = sameAsShipping
        ? shippingData
        : billingForm.getValues();

      if (!contactData.email || !contactData.phone) {
        throw new Error("Please provide your email and phone number");
      }

      if (
        !shippingData.firstName ||
        !shippingData.lastName ||
        !shippingData.addressLine1 ||
        !shippingData.city ||
        !shippingData.state ||
        !shippingData.postcode
      ) {
        throw new Error("Please complete your shipping information");
      }

      if (
        !billingData.firstName ||
        !billingData.lastName ||
        !billingData.addressLine1 ||
        !billingData.city ||
        !billingData.state ||
        !billingData.postcode
      ) {
        throw new Error("Please complete your billing information");
      }

      if (!items.length) {
        throw new Error("Your cart is empty");
      }

      // Prepare address data with IDs if existing addresses are selected
      const shippingAddressData = selectedShippingId
        ? { ...shippingData, id: selectedShippingId }
        : shippingData;

      const billingAddressData = sameAsShipping
        ? shippingAddressData // Use the same data (including ID if selected)
        : selectedBillingId
          ? { ...billingData, id: selectedBillingId }
          : billingData;

      const result = await createOrdersAPI(
        storeGroups,
        contactData,
        shippingAddressData,
        billingAddressData,
        shipping,
        tax,
        riskAssessmentId,
      );

      return result;
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : "Failed to create order";
      console.error("Order creation error:", error);
      toast.error("Could not create order", { description: msg });
      throw error;
    }
  };

  // Create orders and handle payment
  const handlePaymentInit = async () => {
    try {
      // First, perform risk assessment to get assessment ID
      const orderData = getOrderDataForVerification();

      const riskAssessmentResponse = await fetch("/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: total,
          currency: "aud",
          orderData,
        }),
      });

      if (!riskAssessmentResponse.ok) {
        const errorData = await riskAssessmentResponse.json();
        throw new Error(errorData.error || "Risk assessment failed");
      }

      const riskData = await riskAssessmentResponse.json();
      const riskAssessmentId = riskData.riskAssessment?.id;

      // Create orders with risk assessment ID
      const orderResult = await handleCreateOrders(riskAssessmentId);

      if (orderResult.storeCount > 1) {
        toast.info(`Creating ${orderResult.storeCount} orders`, {
          description: `Your items will be shipped separately by each store.`,
        });
      }

      return orderResult.primaryOrderId;
    } catch (error) {
      console.error("Order creation error:", error);
      toast.error("Failed to create order", {
        description: "Please try again or contact support.",
      });
      throw error;
    } finally {
      setIsProcessingOrder(false);
    }
  };

  // Helper functions to get final address data
  const getFinalShippingData = () => {
    if (selectedShippingId) {
      const address = shippingAddresses.find(
        (a) => a.id === selectedShippingId,
      );
      if (address) return address;
    }
    return shippingForm.getValues();
  };

  const getFinalBillingData = () => {
    if (sameAsShipping) {
      return getFinalShippingData();
    }
    if (selectedBillingId) {
      const address = billingAddresses.find((a) => a.id === selectedBillingId);
      if (address) return address;
    }
    return billingForm.getValues();
  };

  // Prepare order data for verification flow
  const getOrderDataForVerification = () => {
    const finalShipping = getFinalShippingData();
    const finalBilling = getFinalBillingData();
    const contactData = contactForm.getValues();

    return {
      items: items.map((item) => ({
        productId:
          typeof item.id === "string"
            ? parseInt((item.id as unknown as string) || "", 10)
            : item.id,
        quantity: item.quantity,
        price: item.price,
      })),
      totalAmount: Math.round(total * 100), // Convert to cents
      contactData,
      shippingAddress: finalShipping,
      billingAddress: finalBilling,
    };
  };

  // Handle successful payment
  const handlePaymentSuccess = async (paymentResult: {
    paymentIntentId: string;
    orderId?: number;
  }) => {
    try {
      clearCart();

      // Navigate immediately to success page
      const params = new URLSearchParams();
      params.set("payment_intent", paymentResult.paymentIntentId);
      if (paymentResult.orderId) {
        params.set("order_id", paymentResult.orderId.toString());
      }

      // Pass store count for success page messaging
      const storeCount = getStoreCount();
      if (storeCount > 1) {
        params.set("store_count", storeCount.toString());
      }

      router.push(`/checkout/success?${params.toString()}`);
    } catch (error) {
      console.error("Post-payment processing error:", error);
      toast.error("Payment successful but order processing failed", {
        description: "Please contact support with your payment confirmation.",
      });
    }
  };

  // Handle payment error
  const handlePaymentError = (error: string | Error) => {
    let errorMessage: string;

    // Check if this is a zero trust error
    if (error instanceof Error) {
      const isZeroTrustBlock = (error as any).isZeroTrustBlock;
      const isZeroTrustVerification = (error as any).isZeroTrustVerification;
      const verificationToken = (error as any).verificationToken;
      const riskScore = (error as any).riskScore;
      const riskFactors = (error as any).riskFactors;

      if (isZeroTrustBlock) {
        // Redirect to blocked page
        const params = new URLSearchParams();
        if (riskScore) params.set("score", riskScore.toString());
        if (riskFactors) params.set("factors", riskFactors.join(","));
        router.push(`/checkout/blocked?${params.toString()}`);
        return;
      }

      if (isZeroTrustVerification && verificationToken) {
        // Redirect to OTP verification page
        const params = new URLSearchParams();
        params.set("token", verificationToken);
        if (riskScore) params.set("score", riskScore.toString());
        if (session?.user?.email) params.set("email", session.user.email);
        router.push(`/checkout/verify-otp?${params.toString()}`);
        return;
      }

      errorMessage = error.message;
    } else {
      errorMessage = error;
    }

    toast.error("Payment failed", {
      description: errorMessage,
      duration: 5000,
    });
  };

  // Step navigation helpers
  const canProceedToShipping = () => {
    const contactData = contactForm.getValues();
    return contactData.email && contactData.phone;
  };

  const canProceedToBilling = () => {
    if (selectedShippingId) return true;
    const shippingData = shippingForm.getValues();
    return (
      shippingData.firstName &&
      shippingData.lastName &&
      shippingData.addressLine1 &&
      shippingData.city &&
      shippingData.state &&
      shippingData.postcode
    );
  };

  const canProceedToPayment = () => {
    if (sameAsShipping) return canProceedToBilling();
    if (selectedBillingId) return true;
    const billingData = billingForm.getValues();
    return (
      billingData.firstName &&
      billingData.lastName &&
      billingData.addressLine1 &&
      billingData.city &&
      billingData.state &&
      billingData.postcode
    );
  };

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-8 md:px-6">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Cart", href: "/cart" },
            { label: "Checkout", href: "/checkout", current: true },
          ]}
        />

        {/* Header */}
        <div className="mt-6 mb-8">
          <div className="mb-4 flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/cart" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Cart
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-bold">Checkout</h1>
          <p className="text-muted-foreground mt-2">
            Complete your purchase securely
          </p>

          {/* Step Indicator */}
          <div className="mt-6 flex items-center gap-2">
            <div
              className={`flex items-center gap-2 ${currentStep === "address" ? "text-primary font-semibold" : "text-muted-foreground"}`}
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full ${currentStep === "address" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
              >
                1
              </div>
              <span>Address & Contact</span>
            </div>
            <div className="bg-border h-px flex-1" />
            <div
              className={`flex items-center gap-2 ${currentStep === "payment" ? "text-primary font-semibold" : "text-muted-foreground"}`}
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full ${currentStep === "payment" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
              >
                2
              </div>
              <span>Payment</span>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Checkout Forms */}
          <div className="space-y-6 lg:col-span-2">
            {/* Address & Contact Step */}
            {currentStep === "address" && (
              <>
                {/* Contact Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="h-5 w-5" />
                      Contact Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Form {...contactForm}>
                      <form className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <FormField
                            control={contactForm.control}
                            name="email"
                            render={({ field, fieldState }) => (
                              <Field data-invalid={!!fieldState.error}>
                                <FieldLabel htmlFor="email">
                                  Email Address
                                </FieldLabel>
                                <FormControl>
                                  <Input
                                    id="email"
                                    type="email"
                                    placeholder="your@email.com"
                                    aria-invalid={!!fieldState.error}
                                    {...field}
                                  />
                                </FormControl>
                                {fieldState.error && (
                                  <p className="text-destructive mt-1 text-sm">
                                    {fieldState.error.message}
                                  </p>
                                )}
                              </Field>
                            )}
                          />
                          <FormField
                            control={contactForm.control}
                            name="phone"
                            render={({ field, fieldState }) => (
                              <Field data-invalid={!!fieldState.error}>
                                <FieldLabel htmlFor="phone">
                                  Phone Number
                                </FieldLabel>
                                <FormControl>
                                  <Input
                                    id="phone"
                                    type="tel"
                                    placeholder="+61 4 1234 5678"
                                    aria-invalid={!!fieldState.error}
                                    {...field}
                                  />
                                </FormControl>
                                {fieldState.error && (
                                  <p className="text-destructive mt-1 text-sm">
                                    {fieldState.error.message}
                                  </p>
                                )}
                              </Field>
                            )}
                          />
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>

                {/* Shipping Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Shipping Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Saved Addresses */}
                    {shippingAddresses.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>Use Saved Address</Label>
                          <Button variant="link" size="sm" asChild>
                            <Link href="/account/addresses" target="_blank">
                              Manage Addresses
                            </Link>
                          </Button>
                        </div>
                        <RadioGroup
                          value={
                            selectedShippingId
                              ? selectedShippingId.toString()
                              : "new"
                          }
                          onValueChange={(value) => {
                            if (value === "new") {
                              setSelectedShippingId(null);
                            } else {
                              const addressId = parseInt(value);
                              handleShippingAddressSelect(addressId);
                            }
                          }}
                        >
                          {shippingAddresses.map((address) => (
                            <div
                              key={address.id}
                              className="flex items-start space-x-2 rounded-lg border p-3"
                            >
                              <RadioGroupItem
                                value={address.id.toString()}
                                id={`shipping-${address.id}`}
                              />
                              <Label
                                htmlFor={`shipping-${address.id}`}
                                className="flex-1 cursor-pointer"
                              >
                                <div className="font-medium">
                                  {address.firstName} {address.lastName}
                                </div>
                                <div className="text-muted-foreground text-sm">
                                  {address.addressLine1}
                                  {address.addressLine2 &&
                                    `, ${address.addressLine2}`}
                                </div>
                                <div className="text-muted-foreground text-sm">
                                  {address.city}, {address.state}{" "}
                                  {address.postcode}
                                </div>
                                {address.isDefault && (
                                  <Badge variant="secondary" className="mt-1">
                                    Default
                                  </Badge>
                                )}
                              </Label>
                            </div>
                          ))}
                          <div className="flex items-start space-x-2 rounded-lg border p-3">
                            <RadioGroupItem value="new" id="shipping-new" />
                            <Label
                              htmlFor="shipping-new"
                              className="flex-1 cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <Plus className="h-4 w-4" />
                                <span className="font-medium">
                                  Use a different address
                                </span>
                              </div>
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>
                    )}

                    {/* New Address Form */}
                    {!selectedShippingId && (
                      <AddressForm
                        type="shipping"
                        form={shippingForm}
                        hideButtons={true}
                      />
                    )}
                  </CardContent>
                </Card>

                {/* Billing Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Billing Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Same as Shipping Checkbox */}
                    <div className="flex items-center space-x-2 rounded-lg border p-3">
                      <Checkbox
                        id="sameAsShipping"
                        checked={sameAsShipping}
                        onCheckedChange={handleSameAsShippingChange}
                      />
                      <Label
                        htmlFor="sameAsShipping"
                        className="cursor-pointer"
                      >
                        Same as shipping address
                      </Label>
                    </div>

                    {!sameAsShipping && (
                      <>
                        {/* Saved Billing Addresses */}
                        {billingAddresses.length > 0 && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Label>Use Saved Billing Address</Label>
                              <Button variant="link" size="sm" asChild>
                                <Link href="/account/addresses" target="_blank">
                                  Manage Addresses
                                </Link>
                              </Button>
                            </div>
                            <RadioGroup
                              value={
                                selectedBillingId
                                  ? selectedBillingId.toString()
                                  : "new"
                              }
                              onValueChange={(value) => {
                                if (value === "new") {
                                  setSelectedBillingId(null);
                                } else {
                                  const addressId = parseInt(value);
                                  handleBillingAddressSelect(addressId);
                                }
                              }}
                            >
                              {billingAddresses.map((address) => (
                                <div
                                  key={address.id}
                                  className="flex items-start space-x-2 rounded-lg border p-3"
                                >
                                  <RadioGroupItem
                                    value={address.id.toString()}
                                    id={`billing-${address.id}`}
                                  />
                                  <Label
                                    htmlFor={`billing-${address.id}`}
                                    className="flex-1 cursor-pointer"
                                  >
                                    <div className="font-medium">
                                      {address.firstName} {address.lastName}
                                    </div>
                                    <div className="text-muted-foreground text-sm">
                                      {address.addressLine1}
                                      {address.addressLine2 &&
                                        `, ${address.addressLine2}`}
                                    </div>
                                    <div className="text-muted-foreground text-sm">
                                      {address.city}, {address.state}{" "}
                                      {address.postcode}
                                    </div>
                                    {address.isDefault && (
                                      <Badge
                                        variant="secondary"
                                        className="mt-1"
                                      >
                                        Default
                                      </Badge>
                                    )}
                                  </Label>
                                </div>
                              ))}
                              <div className="flex items-start space-x-2 rounded-lg border p-3">
                                <RadioGroupItem value="new" id="billing-new" />
                                <Label
                                  htmlFor="billing-new"
                                  className="flex-1 cursor-pointer"
                                >
                                  <div className="flex items-center gap-2">
                                    <Plus className="h-4 w-4" />
                                    <span className="font-medium">
                                      Use a different address
                                    </span>
                                  </div>
                                </Label>
                              </div>
                            </RadioGroup>
                          </div>
                        )}

                        {/* New Billing Address Form */}
                        {!selectedBillingId && (
                          <AddressForm
                            type="billing"
                            form={billingForm}
                            hideButtons={true}
                          />
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Proceed to Payment Button */}
                <div className="flex justify-end">
                  <Button
                    size="lg"
                    onClick={handleProceedToPayment}
                    className="min-w-[200px]"
                  >
                    Proceed to Payment
                  </Button>
                </div>
              </>
            )}

            {/* Payment Step */}
            {currentStep === "payment" && (
              <>
                {/* Back Button */}
                <Button
                  variant="ghost"
                  onClick={() => setCurrentStep("address")}
                  className="mb-4"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Address & Contact
                </Button>

                {/* Payment */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Payment
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {getStoreCount() > 1 && (
                      <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm dark:border-blue-800 dark:bg-blue-950">
                        <p className="mb-1 font-medium text-blue-900 dark:text-blue-100">
                          Processing {getStoreCount()} Orders
                        </p>
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          Your payment will be processed once for the total
                          amount, and {getStoreCount()} separate orders will be
                          created for each store.
                        </p>
                      </div>
                    )}
                    <StripePaymentForm
                      amount={total}
                      currency="aud"
                      onSuccess={handlePaymentSuccess}
                      onError={handlePaymentError}
                      onCreateOrder={handlePaymentInit}
                      orderData={getOrderDataForVerification()}
                    />
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Items Summary */}
                <div className="space-y-3">
                  {storeGroups.map((storeGroup) => (
                    <div key={storeGroup.storeId}>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {storeGroup.storeName}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {storeGroup.itemCount}{" "}
                          {storeGroup.itemCount === 1 ? "item" : "items"}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        {storeGroup.items.map((item) => (
                          <div
                            key={`${item.id}-${item.color}`}
                            className="flex items-center gap-3"
                          >
                            <div className="relative h-12 w-12 overflow-hidden rounded-md border">
                              <Image
                                src={item.image || "/placeholder.svg"}
                                alt={item.name}
                                fill
                                className="object-cover"
                                sizes="48px"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="line-clamp-1 text-sm font-medium">
                                {item.name}
                              </p>
                              <p className="text-muted-foreground text-xs">
                                Qty: {item.quantity} × ${item.price.toFixed(2)}
                              </p>
                            </div>
                            <div className="text-sm font-medium">
                              ${(item.price * item.quantity).toFixed(2)}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 text-right text-sm font-medium">
                        Store Subtotal: ${storeGroup.subtotal.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>
                      {shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST (10%)</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>

                {getStoreCount() > 1 && (
                  <div className="bg-muted text-muted-foreground rounded-md p-3 text-sm">
                    <p className="mb-1 font-medium">Multi-Store Order</p>
                    <p className="mb-2">
                      Your cart contains items from {getStoreCount()} different
                      stores. We will create {getStoreCount()} separate orders.
                    </p>
                    <ul className="list-inside list-disc space-y-1 text-xs">
                      <li>
                        Each store will process and ship your items separately
                      </li>
                      <li>You will receive separate order confirmations</li>
                      <li>Shipping and taxes are split proportionally</li>
                    </ul>
                  </div>
                )}

                <p className="text-muted-foreground text-center text-xs">
                  Secure checkout powered by Stripe
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
