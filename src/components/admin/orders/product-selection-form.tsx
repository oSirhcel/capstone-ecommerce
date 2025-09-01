"use client";

import { useState } from "react";
import Image from "next/image";
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
import { Search, Package, Plus, Minus, Trash2 } from "lucide-react";
import type { OrderItem } from "@/app/admin/orders/create/page";

// Mock product data
const mockProducts = [
  {
    id: "1",
    name: "Handcrafted Ceramic Mug",
    price: 24.99,
    image: "/placeholder.svg?height=60&width=60",
    sku: "CM-001",
    stock: 45,
  },
  {
    id: "2",
    name: "Digital Marketing Course",
    price: 129.99,
    image: "/placeholder.svg?height=60&width=60",
    sku: "DMC-001",
    stock: 999,
  },
  {
    id: "3",
    name: "Organic Cotton T-Shirt",
    price: 34.99,
    image: "/placeholder.svg?height=60&width=60",
    sku: "OCT-001",
    stock: 12,
  },
  {
    id: "4",
    name: "Handmade Silver Earrings",
    price: 45.99,
    image: "/placeholder.svg?height=60&width=60",
    sku: "HSE-001",
    stock: 8,
  },
];

interface ProductSelectionFormProps {
  orderItems: OrderItem[];
  onOrderItemsChange: (items: OrderItem[]) => void;
}

export function ProductSelectionForm({
  orderItems,
  onOrderItemsChange,
}: ProductSelectionFormProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showProductSearch, setShowProductSearch] = useState(false);

  const filteredProducts = mockProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const addProduct = (product: (typeof mockProducts)[0]) => {
    const existingItem = orderItems.find((item) => item.id === product.id);

    if (existingItem) {
      updateQuantity(product.id, existingItem.quantity + 1);
    } else {
      const newItem: OrderItem = {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        image: product.image,
        sku: product.sku,
      };
      onOrderItemsChange([...orderItems, newItem]);
    }
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
    onOrderItemsChange(updatedItems);
  };

  const removeProduct = (productId: string) => {
    const updatedItems = orderItems.filter((item) => item.id !== productId);
    onOrderItemsChange(updatedItems);
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
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="hover:bg-background flex cursor-pointer items-center gap-3 rounded-lg border p-3"
                  onClick={() => addProduct(product)}
                >
                  <Image
                    src={product.image || "/placeholder.svg"}
                    alt={product.name}
                    width={40}
                    height={40}
                    className="rounded-md object-cover"
                  />
                  <div className="flex-1">
                    <p className="font-medium">{product.name}</p>
                    <p className="text-muted-foreground text-sm">
                      SKU: {product.sku}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="font-medium">
                        ${product.price.toFixed(2)}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {product.stock} in stock
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
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
