"use client";

import { useSession } from "next-auth/react";
import { useCart } from "@/contexts/cart-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Breadcrumb } from "@/components/product/breadcrumb";

export function CartOverviewClient() {
  const { data: session } = useSession();
  const {
    items,
    isLoading,
    error,
    updateQuantity,
    removeItem,
    storeGroups,
    getStoreCount,
    itemCount,
    subtotal,
  } = useCart();

  // Redirect to login if not authenticated
  if (!session) {
    return (
      <div className="bg-background min-h-screen">
        <div className="container mx-auto px-4 py-12 md:px-6">
          <div className="text-center">
            <ShoppingBag className="text-muted-foreground mx-auto h-12 w-12" />
            <h1 className="mt-4 text-2xl font-bold">Please Sign In</h1>
            <p className="text-muted-foreground mt-2">
              You need to be signed in to view your cart.
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
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
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
            <h1 className="text-2xl font-bold">Error Loading Cart</h1>
            <p className="mt-2">Failed to load your cart. Please try again.</p>
            <Button asChild className="mt-4">
              <Link href="/">Return Home</Link>
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
            <ShoppingBag className="text-muted-foreground mx-auto h-12 w-12" />
            <h1 className="mt-4 text-2xl font-bold">Your Cart is Empty</h1>
            <p className="text-muted-foreground mt-2">
              Add some items to your cart to get started.
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

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(productId);
      toast("Item removed from cart");
    } else {
      updateQuantity(productId, newQuantity);
    }
  };

  const handleRemoveItem = (productId: string, productName: string) => {
    removeItem(productId);
    toast(`${productName} removed from cart`);
  };

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-8 md:px-6">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Cart", href: "/cart", current: true },
          ]}
        />

        {/* Header */}
        <div className="mt-6 mb-8">
          <div className="mb-4 flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Continue Shopping
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-bold">Shopping Cart</h1>
          <p className="text-muted-foreground mt-2">
            {itemCount} {itemCount === 1 ? "item" : "items"} in your cart
            {getStoreCount() > 1 && (
              <span className="ml-2">from {getStoreCount()} stores</span>
            )}
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Cart Items */}
          <div className="space-y-6 lg:col-span-2">
            {storeGroups.map((storeGroup) => (
              <Card key={storeGroup.storeId}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {storeGroup.storeName}
                    </CardTitle>
                    <Badge variant="outline">
                      {storeGroup.itemCount}{" "}
                      {storeGroup.itemCount === 1 ? "item" : "items"}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Subtotal: ${storeGroup.subtotal.toFixed(2)}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {storeGroup.items.map((item) => (
                    <div
                      key={`${item.id}-${item.color}`}
                      className="flex items-center gap-4"
                    >
                      <div className="relative h-20 w-20 overflow-hidden rounded-md border">
                        <Image
                          src={item.image || "/placeholder.svg"}
                          alt={item.name}
                          fill
                          className="aspect-square object-contain"
                          sizes="80px"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/product/${item.slug ?? item.id}`}
                          className="line-clamp-1 font-medium hover:underline"
                        >
                          {item.name}
                        </Link>
                        <p className="text-muted-foreground text-sm">
                          ${item.price.toFixed(2)} each
                        </p>
                        {item.color && (
                          <p className="text-muted-foreground text-sm">
                            Color: {item.color}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            handleQuantityChange(item.id, item.quantity - 1)
                          }
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm font-medium">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            handleQuantityChange(item.id, item.quantity + 1)
                          }
                          disabled={item.quantity >= item.stock}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>

                      <div className="text-right">
                        <div className="font-medium">
                          ${(item.price * item.quantity).toFixed(2)}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(item.id, item.name)}
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Multi-store breakdown */}
                {getStoreCount() > 1 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Store Breakdown</h4>
                    {storeGroups.map((storeGroup) => (
                      <div
                        key={storeGroup.storeId}
                        className="flex justify-between text-sm"
                      >
                        <span className="text-muted-foreground">
                          {storeGroup.storeName}
                        </span>
                        <span>${storeGroup.subtotal.toFixed(2)}</span>
                      </div>
                    ))}
                    <Separator />
                  </div>
                )}

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

                <Button
                  className="w-full"
                  size="lg"
                  disabled={items.length === 0}
                  asChild
                >
                  <Link href="/checkout">Proceed to Checkout</Link>
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
