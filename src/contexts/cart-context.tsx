"use client";

import { createContext, useContext, useReducer, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart as clearCartAPI,
} from "@/lib/api/cart";

// Extend the session user type to include our custom fields
interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  userType?: string;
}

export type CartItem = {
  id: string;
  slug?: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  color?: string;
  storeId: string;
  storeName: string;
  stock: number;
};

type CartState = {
  isOpen: boolean;
};

type CartAction = { type: "OPEN_CART" } | { type: "CLOSE_CART" };

const initialState: CartState = {
  isOpen: false,
};

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case "OPEN_CART":
      return { ...state, isOpen: true };
    case "CLOSE_CART":
      return { ...state, isOpen: false };
    default:
      return state;
  }
};

export interface StoreGroup {
  storeId: string;
  storeName: string;
  items: CartItem[];
  subtotal: number;
  itemCount: number;
}

type CartContextType = {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  itemCount: number;
  subtotal: number;
  isLoading: boolean;
  error: Error | null;
  // Multi-store functionality
  storeGroups: StoreGroup[];
  getStoreGroup: (storeId: string) => StoreGroup | undefined;
  getStoreCount: () => number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const router = useRouter();

  // Fetch cart data from API
  const {
    data: cartData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["cart"],
    queryFn: fetchCart,
    enabled: !!(session?.user as SessionUser)?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Mutations for cart operations
  const addItemMutation = useMutation({
    mutationFn: ({
      productId,
      quantity,
    }: {
      productId: string;
      quantity: number;
    }) => addToCart(productId, quantity),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });

  const updateQuantityMutation = useMutation({
    mutationFn: ({
      productId,
      quantity,
    }: {
      productId: string;
      quantity: number;
    }) => updateCartItem(productId, quantity),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: (productId: string) => removeFromCart(productId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });

  const clearCartMutation = useMutation({
    mutationFn: clearCartAPI,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });

  const addItem = (item: CartItem) => {
    if (!(session?.user as SessionUser)?.id) {
      const callbackUrl =
        typeof window !== "undefined"
          ? encodeURIComponent(window.location.href)
          : "/";
      router.push(`/auth/signin?callbackUrl=${callbackUrl}`);
      return;
    }
    addItemMutation.mutate({ productId: item.id, quantity: item.quantity });
    dispatch({ type: "OPEN_CART" });
  };

  const removeItem = (id: string) => {
    if (!(session?.user as SessionUser)?.id) {
      console.error("User must be logged in to remove items from cart");
      return;
    }
    removeItemMutation.mutate(id);
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (!(session?.user as SessionUser)?.id) {
      console.error("User must be logged in to update cart");
      return;
    }
    updateQuantityMutation.mutate({ productId: id, quantity });
  };

  const clearCart = () => {
    if (!(session?.user as SessionUser)?.id) {
      console.error("User must be logged in to clear cart");
      return;
    }
    clearCartMutation.mutate();
  };

  const openCart = () => {
    dispatch({ type: "OPEN_CART" });
  };

  const closeCart = () => {
    dispatch({ type: "CLOSE_CART" });
  };

  const items = cartData?.items ?? [];
  const itemCount = cartData?.itemCount ?? 0;
  const subtotal = cartData?.subtotal ?? 0;

  // Multi-store functionality
  const storeGroups: StoreGroup[] = items.reduce(
    (groups: StoreGroup[], item) => {
      const existingGroup = groups.find(
        (group) => group.storeId === item.storeId,
      );

      if (existingGroup) {
        existingGroup.items.push(item);
        existingGroup.subtotal += item.price * item.quantity;
        existingGroup.itemCount += item.quantity;
      } else {
        groups.push({
          storeId: item.storeId,
          storeName: item.storeName,
          items: [item],
          subtotal: item.price * item.quantity,
          itemCount: item.quantity,
        });
      }

      return groups;
    },
    [],
  );

  const getStoreGroup = (storeId: string): StoreGroup | undefined => {
    return storeGroups.find((group) => group.storeId === storeId);
  };

  const getStoreCount = (): number => {
    return storeGroups.length;
  };

  return (
    <CartContext.Provider
      value={{
        items,
        isOpen: state.isOpen,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        openCart,
        closeCart,
        itemCount,
        subtotal,
        isLoading:
          isLoading ??
          addItemMutation.isPending ??
          updateQuantityMutation.isPending ??
          removeItemMutation.isPending ??
          clearCartMutation.isPending,
        error:
          error ??
          addItemMutation.error ??
          updateQuantityMutation.error ??
          removeItemMutation.error ??
          clearCartMutation.error,
        // Multi-store functionality
        storeGroups,
        getStoreGroup,
        getStoreCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
