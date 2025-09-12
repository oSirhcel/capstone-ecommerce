"use client";

import { ShoppingCart } from "lucide-react";
import { useCart } from "@/contexts/cart-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function CartButton() {
  const { openCart, itemCount } = useCart();

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative"
      onClick={openCart}
      aria-label="Open cart"
    >
      <ShoppingCart className="h-5 w-5" />
      {itemCount > 0 && (
        <Badge
          className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs"
          variant="destructive"
        >
          {itemCount > 99 ? "99+" : itemCount}
        </Badge>
      )}
    </Button>
  );
}
