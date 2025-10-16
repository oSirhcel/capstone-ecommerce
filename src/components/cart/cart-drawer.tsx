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
  const { items, isOpen, closeCart, itemCount, storeGroups, getStoreCount } =
    useCart();

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent className="flex w-full flex-col p-0 sm:max-w-lg">
        <SheetHeader className="flex-shrink-0 space-y-2.5 p-6 pb-0">
          <SheetTitle className="flex items-center justify-between">
            Your Cart ({itemCount} {itemCount === 1 ? "item" : "items"})
            {getStoreCount() > 1 && (
              <span className="text-muted-foreground text-sm font-normal">
                from {getStoreCount()} stores
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        {items.length > 0 ? (
          <>
            <ScrollArea className="min-h-0 flex-1">
              <div className="space-y-6 p-6 pt-4">
                {storeGroups.map((storeGroup) => (
                  <div key={storeGroup.storeId} className="space-y-4">
                    {getStoreCount() > 1 && (
                      <div className="border-b pb-2">
                        <h3 className="text-muted-foreground text-sm font-medium">
                          {storeGroup.storeName}
                        </h3>
                        <p className="text-muted-foreground text-xs">
                          {storeGroup.itemCount}{" "}
                          {storeGroup.itemCount === 1 ? "item" : "items"} • $
                          {storeGroup.subtotal.toFixed(2)}
                        </p>
                      </div>
                    )}
                    <div className="space-y-4">
                      {storeGroup.items.map((item) => (
                        <CartItem
                          key={`${item.id}-${item.color}`}
                          item={item}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="bg-background flex-shrink-0 border-t p-6">
              <CartSummary />
            </div>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center space-y-4 p-6">
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
