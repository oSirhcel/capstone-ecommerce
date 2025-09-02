"use client";

import { useCart } from "@/contexts/cart-context";
import { Button } from "@/components/ui/button";
import { CartItem } from "@/components/cart/cart-item";
import { CartSummary } from "@/components/cart/cart-summary";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export function CartDrawer() {
  const { items, isOpen, closeCart, itemCount } = useCart();

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent className="flex w-full flex-col p-6 sm:max-w-lg">
        <SheetHeader className="space-y-2.5 pr-6">
          <SheetTitle className="flex items-center justify-between">
            Your Cart ({itemCount} {itemCount === 1 ? "item" : "items"})
          </SheetTitle>
        </SheetHeader>

        {items.length > 0 ? (
          <>
            <ScrollArea className="flex-1 py-6">
              <div className="space-y-6">
                {items.map((item) => (
                  <CartItem key={`${item.id}-${item.color}`} item={item} />
                ))}
              </div>
            </ScrollArea>
            <CartSummary />
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center space-y-4">
            <div className="text-center">
              <p className="text-lg font-medium">Your cart is empty</p>
              <p className="text-muted-foreground text-sm">
                Add items to your cart to see them here.
              </p>
            </div>
            <Button onClick={closeCart}>Continue Shopping</Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
