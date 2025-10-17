"use client";

import Link from "next/link";
import { useCart } from "@/contexts/cart-context";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export function CartSummary() {
  const { subtotal, closeCart, storeGroups, getStoreCount } = useCart();

  // Calculate shipping, tax, and total
  const shipping = subtotal > 50 ? 0 : 5.99;
  const tax = subtotal * 0.1; // 10% GST for Australia
  const total = subtotal + shipping + tax;

  return (
    <div className="space-y-4 pt-6">
      <Separator />

      {/* Multi-store breakdown */}
      {getStoreCount() > 1 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Order Breakdown</h4>
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

      <div className="space-y-1.5">
        <div className="flex justify-between">
          <span className="text-sm">Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm">Shipping</span>
          <span>{shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm">Tax (8%)</span>
          <span>${tax.toFixed(2)}</span>
        </div>
      </div>
      <Separator />
      <div className="flex justify-between font-medium">
        <span>Total</span>
        <span>${total.toFixed(2)}</span>
      </div>

      {getStoreCount() > 1 && (
        <div className="bg-muted text-muted-foreground rounded-md p-3 text-sm">
          <p className="mb-1 font-medium">Multi-Store Order</p>
          <p>
            Your order contains items from {getStoreCount()} different stores.
            Each store will process and ship your items separately.
          </p>
        </div>
      )}

      <Button asChild className="w-full" size="lg">
        <Link href="/cart" onClick={closeCart}>
          View Cart
        </Link>
      </Button>
      <Button variant="outline" className="w-full" onClick={closeCart}>
        Continue Shopping
      </Button>
    </div>
  );
}
