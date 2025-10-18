"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useFormContext } from "react-hook-form";
import type { OrderFormValues } from "@/app/admin/orders/create/page";
import { useMemo } from "react";

export function OrderSummaryForm() {
  const { watch } = useFormContext<OrderFormValues>();
  const orderItems = watch("orderItems");

  // Calculate totals
  const subtotal = useMemo(
    () => orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [orderItems],
  );

  const itemCount = useMemo(
    () => orderItems.reduce((sum, item) => sum + item.quantity, 0),
    [orderItems],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Subtotal */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              Subtotal • {itemCount} {itemCount === 1 ? "item" : "items"}
            </span>
            <span className="font-medium">
              {orderItems.length === 0 ? "—" : `$${subtotal.toFixed(2)}`}
            </span>
          </div>

          <Separator />

          {/* Total */}
          <div className="flex justify-between">
            <span className="font-semibold">Total</span>
            <span className="font-semibold">
              {orderItems.length === 0 ? "—" : `$${subtotal.toFixed(2)}`}
            </span>
          </div>
        </div>

        <Separator />

        {/* Payment Details */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Paid by customer</span>
            <span className="font-medium">$0.00</span>
          </div>

          <div className="flex justify-between">
            <span className="font-medium">Balance</span>
            <span className="font-medium">
              {orderItems.length === 0 ? "—" : `$${subtotal.toFixed(2)}`}
            </span>
          </div>
        </div>

        {orderItems.length === 0 && (
          <div className="text-muted-foreground rounded-lg border border-dashed p-4 text-center text-sm">
            Add products to see payment summary
          </div>
        )}
      </CardContent>
    </Card>
  );
}
