import type { CartItem } from "@/contexts/cart-context";

export interface CartResponse {
  cartId: number;
  items: CartItem[];
  itemCount: number;
  subtotal: number;
}

export interface AddToCartRequest {
  productId: string;
  quantity?: number;
}

export interface UpdateCartRequest {
  productId: string;
  quantity: number;
}

// Fetch user's cart
export async function fetchCart(): Promise<CartResponse> {
  const response = await fetch("/api/cart", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch cart");
  }

  return (await response.json()) as CartResponse;
}

// Add item to cart
export async function addToCart(
  productId: string,
  quantity = 1,
): Promise<void> {
  const response = await fetch("/api/cart", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ productId, quantity }),
  });

  if (!response.ok) {
    throw new Error("Failed to add item to cart");
  }
}

// Update cart item quantity
export async function updateCartItem(
  productId: string,
  quantity: number,
): Promise<void> {
  const response = await fetch("/api/cart", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ productId, quantity }),
  });

  if (!response.ok) {
    throw new Error("Failed to update cart item");
  }
}

// Remove item from cart
export async function removeFromCart(productId: string): Promise<void> {
  const response = await fetch(`/api/cart?productId=${productId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to remove item from cart");
  }
}

// Clear entire cart
export async function clearCart(): Promise<void> {
  const response = await fetch("/api/cart", {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to clear cart");
  }
}
