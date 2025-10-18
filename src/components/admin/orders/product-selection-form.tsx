"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { useFormContext } from "react-hook-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Package, Plus, Minus, Trash2, Loader2 } from "lucide-react";
import type {
  OrderItem,
  OrderFormValues,
} from "@/app/admin/orders/create/page";
import { useProductsQuery } from "@/hooks/admin/orders/use-products-query";
import { useDebounce } from "@/hooks/use-debounce";

interface ProductSelectionFormProps {
  storeId: string;
}

export function ProductSelectionForm({ storeId }: ProductSelectionFormProps) {
  const { watch, setValue } = useFormContext<OrderFormValues>();
  const orderItems = watch("orderItems");
  const [searchTerm, setSearchTerm] = useState("");
  const [showProductSearch, setShowProductSearch] = useState(false);
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Fetch products
  const { data: productsData, isLoading: isLoadingProducts } = useProductsQuery(
    storeId,
    debouncedSearch,
  );

  const products = useMemo(() => {
    // Filter for active products only
    return (
      productsData?.products.filter(
        (p) => p.status === "active" && p.price !== null,
      ) ?? []
    );
  }, [productsData]);

  const addProduct = (product: {
    id: number;
    name: string;
    price: number | null;
    stock: number;
    sku: string | null;
    images: Array<{ imageUrl: string; isPrimary: boolean }>;
  }) => {
    if (!product.price) return;

    // Check if product is already in order items
    const existingItem = orderItems.find(
      (item) => item.id === String(product.id),
    );

    // Don't add if already exists
    if (existingItem) {
      return;
    }

    const primaryImage = product.images.find((img) => img.isPrimary);
    const newItem: OrderItem = {
      id: String(product.id),
      name: product.name,
      price: product.price / 100, // Convert cents to dollars
      quantity: 1,
      image: primaryImage?.imageUrl ?? "/placeholder.svg",
      sku: product.sku ?? "",
    };
    setValue("orderItems", [...orderItems, newItem]);
    setShowProductSearch(false);
    setSearchTerm("");
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeProduct(productId);
      return;
    }

    const updatedItems = orderItems.map((item) =>
      item.id === productId ? { ...item, quantity: newQuantity } : item,
    );
    setValue("orderItems", updatedItems);
  };

  const removeProduct = (productId: string) => {
    const updatedItems = orderItems.filter((item) => item.id !== productId);
    setValue("orderItems", updatedItems);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Products
            </CardTitle>
            <CardDescription>Add products to this order</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowProductSearch(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Product Search */}
        {showProductSearch && (
          <div className="bg-muted/20 space-y-4 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Search Products</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowProductSearch(false);
                  setSearchTerm("");
                }}
              >
                Cancel
              </Button>
            </div>

            <div className="relative">
              <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
              <Input
                placeholder="Search products by name or SKU..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="max-h-60 space-y-2 overflow-y-auto">
              {isLoadingProducts ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : products.length > 0 ? (
                products.map((product) => {
                  const primaryImage = product.images.find(
                    (img) => img.isPrimary,
                  );
                  const isAlreadyAdded = orderItems.some(
                    (item) => item.id === String(product.id),
                  );
                  return (
                    <div
                      key={product.id}
                      className={`flex items-center gap-3 rounded-lg border p-3 ${
                        isAlreadyAdded
                          ? "cursor-not-allowed opacity-60"
                          : "hover:bg-background cursor-pointer"
                      }`}
                      onClick={() => !isAlreadyAdded && addProduct(product)}
                    >
                      <Image
                        src={primaryImage?.imageUrl ?? "/placeholder.svg"}
                        alt={product.name}
                        width={40}
                        height={40}
                        className="rounded-md object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{product.name}</p>
                          {isAlreadyAdded && (
                            <Badge variant="secondary" className="text-xs">
                              Added
                            </Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground text-sm">
                          SKU: {product.sku ?? "N/A"}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="font-medium">
                            ${((product.price ?? 0) / 100).toFixed(2)}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {product.stock} in stock
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-muted-foreground py-8 text-center text-sm">
                  No products found
                </p>
              )}
            </div>
          </div>
        )}

        {/* Order Items */}
        {orderItems.length > 0 ? (
          <div className="space-y-4">
            {orderItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 rounded-lg border p-4"
              >
                <Image
                  src={item.image || "/placeholder.svg"}
                  alt={item.name}
                  width={60}
                  height={60}
                  className="rounded-md object-cover"
                />
                <div className="flex-1">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-muted-foreground text-sm">
                    SKU: {item.sku}
                  </p>
                  <p className="font-medium">${item.price.toFixed(2)} each</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 bg-transparent"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center font-medium">
                    {item.quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 bg-transparent"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => removeProduct(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-muted-foreground py-8 text-center">
            <Package className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p>No products added yet</p>
            <p className="text-sm">
              Click &quot;Add Product&quot; to get started
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
