"use client";

import { useSession } from "next-auth/react";
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

export function CheckoutClient() {
  const { data: session } = useSession();
  const {
    items,
    isLoading,
    error,
    storeGroups,
    getStoreCount,
    subtotal,
    clearCart,
  } = useCart();

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

  const handleCheckout = () => {
    // Simulate successful checkout
    toast.success("Order placed successfully!", {
      description: `Your order total is $${total.toFixed(2)}. You will receive a confirmation email shortly.`,
      duration: 5000,
    });

    // Clear the cart
    clearCart();

    // Redirect to home after a short delay
    setTimeout(() => {
      window.location.href = "/";
    }, 2000);
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
            {/* Contact Information */}
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
                      defaultValue={session?.user?.email ?? ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+61 4 1234 5678"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Shipping Information */}
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
                    <Input id="firstName" placeholder="John" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" placeholder="Doe" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" placeholder="123 Main Street" />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" placeholder="Sydney" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Select>
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
                    <Label htmlFor="zip">Postcode</Label>
                    <Input id="zip" placeholder="2000" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Select defaultValue="AU">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AU">Australia</SelectItem>
                      <SelectItem value="US">United States</SelectItem>
                      <SelectItem value="CA">Canada</SelectItem>
                      <SelectItem value="GB">United Kingdom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Payment Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input
                    id="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="expiry">Expiry Date</Label>
                    <Input id="expiry" placeholder="MM/YY" maxLength={5} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvc">CVC</Label>
                    <Input id="cvc" placeholder="123" maxLength={4} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">Postcode</Label>
                    <Input id="zipCode" placeholder="2000" maxLength={10} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cardName">Name on Card</Label>
                  <Input id="cardName" placeholder="John Doe" />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox id="saveCard" />
                  <Label htmlFor="saveCard" className="text-sm">
                    Save this card for future purchases
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Security Notice */}
            <Card className="border-green-200 bg-green-50">
              <CardContent>
                <div className="flex items-center gap-2 text-green-800">
                  <Shield className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Your payment information is secure and encrypted
                  </span>
                </div>
                <p className="mt-1 text-sm text-green-700">
                  We use industry-standard encryption to protect your data.
                </p>
              </CardContent>
            </Card>
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

                <Button className="w-full" size="lg" onClick={handleCheckout}>
                  Complete Order
                </Button>

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
