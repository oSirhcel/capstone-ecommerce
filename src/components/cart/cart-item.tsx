"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import {
  useCart,
  type CartItem as CartItemType,
} from "@/contexts/cart-context";
import { Button } from "@/components/ui/button";

interface CartItemProps {
  item: CartItemType;
}

export function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeItem } = useCart();

  const handleIncrement = () => {
    updateQuantity(item.id, item.quantity + 1);
  };

  const handleDecrement = () => {
    if (item.quantity > 1) {
      updateQuantity(item.id, item.quantity - 1);
    }
  };

  const handleRemove = () => {
    removeItem(item.id);
  };

  return (
    <div className="flex items-start gap-4 py-2">
      <div className="bg-muted relative h-20 w-20 overflow-hidden rounded-md border">
        <Image
          src={item.image || "/placeholder.svg"}
          alt={item.name}
          fill
          className="aspect-square object-contain"
          sizes="80px"
        />
      </div>
      <div className="flex flex-1 flex-col">
        <div className="flex justify-between">
          <div>
            <Link
              href={`/product/${item.slug ?? item.id}`}
              className="line-clamp-1 font-medium hover:underline"
            >
              {item.name}
            </Link>
            <div className="text-muted-foreground mt-1 text-sm">
              <Link href={`/store/${item.storeId}`} className="hover:underline">
                {item.storeName}
              </Link>
            </div>
            {item.color && (
              <div className="text-muted-foreground mt-1 text-sm">
                Color: {item.color}
              </div>
            )}
          </div>
          <div className="text-right font-medium">
            ${(item.price * item.quantity).toFixed(2)}
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-r-none"
              onClick={handleDecrement}
              disabled={item.quantity <= 1}
            >
              <Minus className="h-3 w-3" />
              <span className="sr-only">Decrease quantity</span>
            </Button>
            <div className="bg-background flex h-8 w-10 items-center justify-center border-y text-center text-sm">
              {item.quantity}
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-l-none"
              onClick={handleIncrement}
            >
              <Plus className="h-3 w-3" />
              <span className="sr-only">Increase quantity</span>
            </Button>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground h-8 w-8"
            onClick={handleRemove}
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Remove item</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
