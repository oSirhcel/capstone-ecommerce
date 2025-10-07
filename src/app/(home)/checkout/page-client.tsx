"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/cart-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CreditCard, Shield, Mail, MapPin } from "lucide-react";
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
import { toast } from "sonner";
import { StripePaymentForm } from "@/components/checkout/stripe-payment-form";
import { db } from "@/server/db";
import { orders, orderItems } from "@/server/db/schema";

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

  // Form states
  const [currentStep, setCurrentStep] = useState<
    "contact" | "shipping" | "payment"
  >("contact");
  const [contactData, setContactData] = useState({
    email: session?.user?.email || "",
    phone: "",
  });
  const [shippingData, setShippingData] = useState({
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    state: "",
    postcode: "",
    country: "AU",
  });
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);

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

  if (isLoading) {
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

  // Create order in database
  const createOrder = async () => {
    try {
      // Basic client-side validation to avoid server round-trip
      if (!contactData.email || !contactData.phone) {
        throw new Error("Please provide your email and phone number");
      }
      if (
        !shippingData.firstName ||
        !shippingData.lastName ||
        !shippingData.address ||
        !shippingData.city ||
        !shippingData.state ||
        !shippingData.postcode
      ) {
        throw new Error("Please complete your shipping information");
      }
      if (!items.length) {
        throw new Error("Your cart is empty");
      }

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
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
          shippingData,
        }),
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

      // Create order first
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

      // Clear the cart
      clearCart();

      // Redirect to success page
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

      // Redirect to verification page with details
      const params = new URLSearchParams();
      params.set("token", verificationError.verificationToken || "");
      params.set("score", verificationError.riskScore?.toString() || "0");
      params.set("factors", verificationError.riskFactors?.join(",") || "");
      params.set("email", verificationError.userEmail || "");

      router.push(`/checkout/verify?${params.toString()}`);
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

  const canProceedToPayment = () => {
    return (
      shippingData.firstName &&
      shippingData.lastName &&
      shippingData.address &&
      shippingData.city &&
      shippingData.state &&
      shippingData.postcode
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
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Checkout Forms */}
          <div className="space-y-6 lg:col-span-2">
            {/* Multi-step form sections */}
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

            {currentStep === "shipping" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Shipping Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
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
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
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
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      placeholder="123 Main Street"
                      value={shippingData.address}
                      onChange={(e) =>
                        setShippingData({
                          ...shippingData,
                          address: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
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
                      <Label htmlFor="state">State</Label>
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
                          <SelectItem value="WA">Western Australia</SelectItem>
                          <SelectItem value="SA">South Australia</SelectItem>
                          <SelectItem value="TAS">Tasmania</SelectItem>
                          <SelectItem value="ACT">
                            Australian Capital Territory
                          </SelectItem>
                          <SelectItem value="NT">Northern Territory</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="postcode">Postcode</Label>
                      <Input
                        id="postcode"
                        placeholder="2000"
                        value={shippingData.postcode}
                        onChange={(e) =>
                          setShippingData({
                            ...shippingData,
                            postcode: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

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
                      onClick={() => setCurrentStep("payment")}
                      disabled={!canProceedToPayment()}
                    >
                      Continue to Payment
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === "payment" && (
              <>
                <Button
                  variant="outline"
                  size="default"
                  className="mb-4"
                  onClick={() => setCurrentStep("shipping")}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Shipping
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

                {currentStep !== "payment" && (
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => setCurrentStep("payment")}
                    disabled={!canProceedToPayment()}
                  >
                    Proceed to Payment
                  </Button>
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
