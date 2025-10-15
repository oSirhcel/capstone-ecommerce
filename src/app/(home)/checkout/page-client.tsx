"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/cart-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  CreditCard,
  Mail,
  MapPin,
  Plus,
  Package,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { Breadcrumb } from "@/components/product/breadcrumb";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { StripePaymentForm } from "@/components/checkout/stripe-payment-form";
import { useAddressesByType } from "@/hooks/use-addresses";
import type { AddressDTO } from "@/lib/api/addresses";

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

  // Fetch saved addresses
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

  // Form states
  const [currentStep, setCurrentStep] = useState<
    "contact" | "shipping" | "billing" | "payment"
  >("contact");
  const [contactData, setContactData] = useState({
    email: session?.user?.email || "",
    phone: "",
  });

  // Shipping address state
  const [useExistingShipping, setUseExistingShipping] = useState(false);
  const [selectedShippingId, setSelectedShippingId] = useState<number | null>(
    null,
  );
  const [shippingData, setShippingData] = useState({
    firstName: "",
    lastName: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "Australia",
  });

  // Billing address state
  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [useExistingBilling, setUseExistingBilling] = useState(false);
  const [selectedBillingId, setSelectedBillingId] = useState<number | null>(
    null,
  );
  const [billingData, setBillingData] = useState({
    firstName: "",
    lastName: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "Australia",
  });

  const [isProcessingOrder, setIsProcessingOrder] = useState(false);

  // Set default addresses when loaded
  useEffect(() => {
    if (defaultShipping && !selectedShippingId) {
      setSelectedShippingId(defaultShipping.id);
      setUseExistingShipping(true);
      // Populate form data as backup
      setShippingData({
        firstName: defaultShipping.firstName,
        lastName: defaultShipping.lastName,
        addressLine1: defaultShipping.addressLine1,
        addressLine2: defaultShipping.addressLine2 || "",
        city: defaultShipping.city,
        state: defaultShipping.state,
        postalCode: defaultShipping.postalCode,
        country: defaultShipping.country,
      });
    }
  }, [defaultShipping, selectedShippingId]);

  useEffect(() => {
    if (defaultBilling && !selectedBillingId && !sameAsShipping) {
      setSelectedBillingId(defaultBilling.id);
      setUseExistingBilling(true);
      // Populate form data as backup
      setBillingData({
        firstName: defaultBilling.firstName,
        lastName: defaultBilling.lastName,
        addressLine1: defaultBilling.addressLine1,
        addressLine2: defaultBilling.addressLine2 || "",
        city: defaultBilling.city,
        state: defaultBilling.state,
        postalCode: defaultBilling.postalCode,
        country: defaultBilling.country,
      });
    }
  }, [defaultBilling, selectedBillingId, sameAsShipping]);

  // Handle shipping address selection
  const handleShippingAddressSelect = (addressId: number) => {
    const address = shippingAddresses.find((a) => a.id === addressId);
    if (address) {
      setSelectedShippingId(addressId);
      setShippingData({
        firstName: address.firstName,
        lastName: address.lastName,
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2 || "",
        city: address.city,
        state: address.state,
        postalCode: address.postalCode,
        country: address.country,
      });
    }
  };

  // Handle billing address selection
  const handleBillingAddressSelect = (addressId: number) => {
    const address = billingAddresses.find((a) => a.id === addressId);
    if (address) {
      setSelectedBillingId(addressId);
      setBillingData({
        firstName: address.firstName,
        lastName: address.lastName,
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2 || "",
        city: address.city,
        state: address.state,
        postalCode: address.postalCode,
        country: address.country,
      });
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
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  // Get final shipping and billing data
  const getFinalShippingData = () => {
    if (useExistingShipping && selectedShippingId) {
      const address = shippingAddresses.find(
        (a) => a.id === selectedShippingId,
      );
      if (!address) {
        throw new Error(
          "Selected shipping address not found. Please try again.",
        );
      }
      return address;
    }
    return shippingData;
  };

  const getFinalBillingData = () => {
    if (sameAsShipping) {
      return getFinalShippingData();
    }
    if (useExistingBilling && selectedBillingId) {
      const address = billingAddresses.find((a) => a.id === selectedBillingId);
      if (!address) {
        throw new Error(
          "Selected billing address not found. Please try again.",
        );
      }
      return address;
    }
    return billingData;
  };

  // Create order in database
  const createOrder = async () => {
    try {
      // Validation
      if (!contactData.email || !contactData.phone) {
        throw new Error("Please provide your email and phone number");
      }

      const finalShipping = getFinalShippingData();
      const finalBilling = getFinalBillingData();

      if (
        !finalShipping.firstName ||
        !finalShipping.lastName ||
        !finalShipping.addressLine1 ||
        !finalShipping.city ||
        !finalShipping.state ||
        !finalShipping.postalCode
      ) {
        throw new Error("Please complete your shipping information");
      }

      if (
        !finalBilling.firstName ||
        !finalBilling.lastName ||
        !finalBilling.addressLine1 ||
        !finalBilling.city ||
        !finalBilling.state ||
        !finalBilling.postalCode
      ) {
        throw new Error("Please complete your billing information");
      }

      if (!items.length) {
        throw new Error("Your cart is empty");
      }

      const orderPayload = {
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
          const err = await response.json();
          if (err?.error) serverMessage = err.error as string;
        } catch (_) {}
        throw new Error(serverMessage);
      }

      const orderData = await response.json();
      return orderData.orderId;
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : "Failed to create order";
      console.error("Order creation error:", error);
      toast.error("Could not create order", { description: msg });
      throw error;
    }
  };

  // Create order and handle payment
  const handlePaymentInit = async () => {
    try {
      setIsProcessingOrder(true);
      const orderId = await createOrder();
      return orderId;
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

  // Handle successful payment
  const handlePaymentSuccess = async (paymentResult: any) => {
    try {
      toast.success("Payment successful!", {
        description:
          "Your order has been confirmed and will be processed shortly.",
        duration: 5000,
      });

      clearCart();

      setTimeout(() => {
        const params = new URLSearchParams();
        params.set("payment_intent", paymentResult.paymentIntentId);
        if (paymentResult.orderId) {
          params.set("order_id", paymentResult.orderId.toString());
        }
        router.push(`/checkout/success?${params.toString()}`);
      }, 2000);
    } catch (error) {
      console.error("Post-payment processing error:", error);
      toast.error("Payment successful but order processing failed", {
        description: "Please contact support with your payment confirmation.",
      });
    }
  };

  // Handle payment error
  const handlePaymentError = (error: string | Error) => {
    // Check if this is a zero trust block
    if (error instanceof Error && (error as any).isZeroTrustBlock) {
      const zeroTrustError = error as any;

      // Redirect to blocked page with risk details
      const params = new URLSearchParams();
      params.set("score", zeroTrustError.riskScore?.toString() || "0");
      params.set("factors", zeroTrustError.riskFactors?.join(",") || "");
      params.set(
        "support",
        zeroTrustError.supportContact || "support@yourstore.com",
      );

      router.push(`/checkout/blocked?${params.toString()}`);
      return;
    }

    // Check if this is a zero trust verification required
    if (error instanceof Error && (error as any).isZeroTrustVerification) {
      const verificationError = error as any;

      // Redirect to OTP verification page
      const params = new URLSearchParams();
      params.set("token", verificationError.verificationToken || "");
      params.set("score", verificationError.riskScore?.toString() || "0");
      params.set("email", verificationError.userEmail || "");

      router.push(`/checkout/verify-otp?${params.toString()}`);
      return;
    }

    // Handle regular payment errors
    const errorMessage = error instanceof Error ? error.message : error;
    toast.error("Payment failed", {
      description: errorMessage,
      duration: 5000,
    });
  };

  // Step navigation
  const canProceedToShipping = () => {
    return contactData.email && contactData.phone;
  };

  const canProceedToBilling = () => {
    if (useExistingShipping && selectedShippingId) return true;
    return (
      shippingData.firstName &&
      shippingData.lastName &&
      shippingData.addressLine1 &&
      shippingData.city &&
      shippingData.state &&
      shippingData.postalCode
    );
  };

  const canProceedToPayment = () => {
    if (sameAsShipping) return canProceedToBilling();
    if (useExistingBilling && selectedBillingId) return true;
    return (
      billingData.firstName &&
      billingData.lastName &&
      billingData.addressLine1 &&
      billingData.city &&
      billingData.state &&
      billingData.postalCode
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
        <div className="mb-8 mt-6">
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
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Checkout Forms */}
          <div className="space-y-6 lg:col-span-2">
            {/* Contact Information */}
            {currentStep === "contact" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={contactData.email}
                        onChange={(e) =>
                          setContactData({
                            ...contactData,
                            email: e.target.value,
                          })
                        }
                      />
                      <p className="text-muted-foreground text-xs">
                        Security codes will be sent to your account email:{" "}
                        {session?.user?.email}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+61 4 1234 5678"
                        value={contactData.phone}
                        onChange={(e) =>
                          setContactData({
                            ...contactData,
                            phone: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <Button
                    size="default"
                    className="w-full"
                    onClick={() => setCurrentStep("shipping")}
                    disabled={!canProceedToShipping()}
                  >
                    Continue to Shipping
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Shipping Information */}
            {currentStep === "shipping" && (
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
                          useExistingShipping
                            ? selectedShippingId?.toString()
                            : "new"
                        }
                        onValueChange={(value) => {
                          if (value === "new") {
                            setUseExistingShipping(false);
                            setSelectedShippingId(null);
                          } else {
                            setUseExistingShipping(true);
                            const addressId = parseInt(value);
                            setSelectedShippingId(addressId);
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
                                {address.postalCode}
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
                  {(!useExistingShipping || shippingAddresses.length === 0) && (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="shippingFirstName">First Name</Label>
                        <Input
                          id="shippingFirstName"
                          placeholder="John"
                          value={shippingData.firstName}
                          onChange={(e) =>
                            setShippingData({
                              ...shippingData,
                              firstName: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="shippingLastName">Last Name</Label>
                        <Input
                          id="shippingLastName"
                          placeholder="Doe"
                          value={shippingData.lastName}
                          onChange={(e) =>
                            setShippingData({
                              ...shippingData,
                              lastName: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Label htmlFor="shippingAddress1">Address Line 1</Label>
                        <Input
                          id="shippingAddress1"
                          placeholder="123 Main Street"
                          value={shippingData.addressLine1}
                          onChange={(e) =>
                            setShippingData({
                              ...shippingData,
                              addressLine1: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Label htmlFor="shippingAddress2">
                          Address Line 2 (Optional)
                        </Label>
                        <Input
                          id="shippingAddress2"
                          placeholder="Apt, suite, etc."
                          value={shippingData.addressLine2}
                          onChange={(e) =>
                            setShippingData({
                              ...shippingData,
                              addressLine2: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="shippingCity">City</Label>
                        <Input
                          id="shippingCity"
                          placeholder="Sydney"
                          value={shippingData.city}
                          onChange={(e) =>
                            setShippingData({
                              ...shippingData,
                              city: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="shippingState">State</Label>
                        <Select
                          value={shippingData.state}
                          onValueChange={(value) =>
                            setShippingData({ ...shippingData, state: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select state" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NSW">New South Wales</SelectItem>
                            <SelectItem value="VIC">Victoria</SelectItem>
                            <SelectItem value="QLD">Queensland</SelectItem>
                            <SelectItem value="WA">
                              Western Australia
                            </SelectItem>
                            <SelectItem value="SA">South Australia</SelectItem>
                            <SelectItem value="TAS">Tasmania</SelectItem>
                            <SelectItem value="ACT">
                              Australian Capital Territory
                            </SelectItem>
                            <SelectItem value="NT">
                              Northern Territory
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="shippingPostalCode">Postal Code</Label>
                        <Input
                          id="shippingPostalCode"
                          placeholder="2000"
                          value={shippingData.postalCode}
                          onChange={(e) =>
                            setShippingData({
                              ...shippingData,
                              postalCode: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="shippingCountry">Country</Label>
                        <Input
                          id="shippingCountry"
                          value={shippingData.country}
                          onChange={(e) =>
                            setShippingData({
                              ...shippingData,
                              country: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                    <Button
                      variant="outline"
                      size="default"
                      className="flex-1"
                      onClick={() => setCurrentStep("contact")}
                    >
                      Back to Contact
                    </Button>
                    <Button
                      size="default"
                      className="flex-1"
                      onClick={() => setCurrentStep("billing")}
                      disabled={!canProceedToBilling()}
                    >
                      Continue to Billing
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Billing Information */}
            {currentStep === "billing" && (
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
                      onCheckedChange={(checked) => {
                        setSameAsShipping(checked as boolean);
                        if (checked) {
                          setUseExistingBilling(false);
                          setSelectedBillingId(null);
                        }
                      }}
                    />
                    <Label htmlFor="sameAsShipping" className="cursor-pointer">
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
                              useExistingBilling
                                ? selectedBillingId?.toString()
                                : "new"
                            }
                            onValueChange={(value) => {
                              if (value === "new") {
                                setUseExistingBilling(false);
                                setSelectedBillingId(null);
                              } else {
                                setUseExistingBilling(true);
                                const addressId = parseInt(value);
                                setSelectedBillingId(addressId);
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
                                    {address.postalCode}
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
                      {(!useExistingBilling ||
                        billingAddresses.length === 0) && (
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="billingFirstName">First Name</Label>
                            <Input
                              id="billingFirstName"
                              placeholder="John"
                              value={billingData.firstName}
                              onChange={(e) =>
                                setBillingData({
                                  ...billingData,
                                  firstName: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="billingLastName">Last Name</Label>
                            <Input
                              id="billingLastName"
                              placeholder="Doe"
                              value={billingData.lastName}
                              onChange={(e) =>
                                setBillingData({
                                  ...billingData,
                                  lastName: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="col-span-2 space-y-2">
                            <Label htmlFor="billingAddress1">
                              Address Line 1
                            </Label>
                            <Input
                              id="billingAddress1"
                              placeholder="123 Main Street"
                              value={billingData.addressLine1}
                              onChange={(e) =>
                                setBillingData({
                                  ...billingData,
                                  addressLine1: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="col-span-2 space-y-2">
                            <Label htmlFor="billingAddress2">
                              Address Line 2 (Optional)
                            </Label>
                            <Input
                              id="billingAddress2"
                              placeholder="Apt, suite, etc."
                              value={billingData.addressLine2}
                              onChange={(e) =>
                                setBillingData({
                                  ...billingData,
                                  addressLine2: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="billingCity">City</Label>
                            <Input
                              id="billingCity"
                              placeholder="Sydney"
                              value={billingData.city}
                              onChange={(e) =>
                                setBillingData({
                                  ...billingData,
                                  city: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="billingState">State</Label>
                            <Select
                              value={billingData.state}
                              onValueChange={(value) =>
                                setBillingData({ ...billingData, state: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select state" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="NSW">
                                  New South Wales
                                </SelectItem>
                                <SelectItem value="VIC">Victoria</SelectItem>
                                <SelectItem value="QLD">Queensland</SelectItem>
                                <SelectItem value="WA">
                                  Western Australia
                                </SelectItem>
                                <SelectItem value="SA">
                                  South Australia
                                </SelectItem>
                                <SelectItem value="TAS">Tasmania</SelectItem>
                                <SelectItem value="ACT">
                                  Australian Capital Territory
                                </SelectItem>
                                <SelectItem value="NT">
                                  Northern Territory
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="billingPostalCode">
                              Postal Code
                            </Label>
                            <Input
                              id="billingPostalCode"
                              placeholder="2000"
                              value={billingData.postalCode}
                              onChange={(e) =>
                                setBillingData({
                                  ...billingData,
                                  postalCode: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="billingCountry">Country</Label>
                            <Input
                              id="billingCountry"
                              value={billingData.country}
                              onChange={(e) =>
                                setBillingData({
                                  ...billingData,
                                  country: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                    <Button
                      variant="outline"
                      size="default"
                      className="flex-1"
                      onClick={() => setCurrentStep("shipping")}
                    >
                      Back to Shipping
                    </Button>
                    <Button
                      size="default"
                      className="flex-1"
                      onClick={() => setCurrentStep("payment")}
                      disabled={!canProceedToPayment()}
                    >
                      Continue to Payment
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payment */}
            {currentStep === "payment" && (
              <>
                <Button
                  variant="outline"
                  size="default"
                  className="mb-4"
                  onClick={() => setCurrentStep("billing")}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Billing
                </Button>

                <StripePaymentForm
                  amount={total}
                  currency="aud"
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                  onCreateOrder={handlePaymentInit}
                />
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
                    <span>Tax (8%)</span>
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
                    <p>
                      Your order contains items from {getStoreCount()} different
                      stores. Each store will process and ship your items
                      separately.
                    </p>
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
