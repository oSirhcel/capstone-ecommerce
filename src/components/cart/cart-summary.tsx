"use client";

import Link from "next/link";
import { useCart } from "@/contexts/cart-context";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export function CartSummary() {
  const { subtotal, closeCart } = useCart();

  // Calculate shipping, tax, and total
  const shipping = subtotal > 50 ? 0 : 5.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  return (
    <div className="space-y-4 pt-6">
      <Separator />
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
      <Button asChild className="w-full" size="lg">
        <Link href="/checkout" onClick={closeCart}>
          Proceed to Checkout
        </Link>
      </Button>
      <Button variant="outline" className="w-full" onClick={closeCart}>
        Continue Shopping
      </Button>
    </div>
  );
}
