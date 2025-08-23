"use client"

import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ShoppingCart, User, Package } from "lucide-react"
import type { CustomerData, OrderItem } from "@/app/admin/orders/create/page"

interface OrderSummaryFormProps {
  customer: CustomerData | null
  orderItems: OrderItem[]
  subtotal: number
  shipping: number
  tax: number
  total: number
}

export function OrderSummaryForm({ customer, orderItems, subtotal, shipping, tax, total }: OrderSummaryFormProps) {
  return (
    <div className="space-y-6">
      {/* Order Summary */}
      <Card className="sticky top-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Order Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Customer Info */}
          {customer && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <User className="h-4 w-4" />
                Customer
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={customer.avatar || "/placeholder.svg"} alt={customer.name} />
                  <AvatarFallback>{customer.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{customer.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{customer.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Order Items */}
          {orderItems.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Package className="h-4 w-4" />
                Items ({orderItems.length})
              </div>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {orderItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <Image
                      src={item.image || "/placeholder.svg"}
                      alt={item.name}
                      width={40}
                      height={40}
                      className="rounded-md object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        ${item.price.toFixed(2)} × {item.quantity}
                      </p>
                    </div>
                    <div className="text-sm font-medium">${(item.price * item.quantity).toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Order Totals */}
          {orderItems.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax (8%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </>
          )}

          {/* Status Indicators */}
          <div className="space-y-2 pt-4">
            <div className="flex items-center justify-between text-sm">
              <span>Customer:</span>
              <Badge variant={customer ? "default" : "secondary"}>{customer ? "Selected" : "Required"}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Products:</span>
              <Badge variant={orderItems.length > 0 ? "default" : "secondary"}>
                {orderItems.length > 0 ? `${orderItems.length} added` : "Required"}
              </Badge>
            </div>
          </div>

          {/* Order Notes */}
          <div className="text-xs text-muted-foreground p-3 bg-muted/30 rounded-lg">
            <p className="font-medium mb-1">Order Creation Notes:</p>
            <ul className="space-y-1">
              <li>• Order will be created with &quot;Processing&quot; status</li>
              <li>• Customer will receive order confirmation email</li>
              <li>• Inventory will be automatically updated</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
