"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useFormContext } from "react-hook-form";
import type { OrderFormValues } from "@/app/admin/orders/create/page";
import { useMemo } from "react";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useShippingMethodsQuery } from "@/hooks/admin/settings/use-shipping-methods";
import { Loader2 } from "lucide-react";

export function OrderSummaryForm() {
  const { watch, control } = useFormContext<OrderFormValues>();
  const orderItems = watch("orderItems");
  const shippingMethodId = watch("shippingMethodId");
  const { data: shippingMethods = [], isLoading: isLoadingShippingMethods } =
    useShippingMethodsQuery();

  // Calculate totals
  const subtotal = useMemo(
    () => orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [orderItems],
  );

  const itemCount = useMemo(
    () => orderItems.reduce((sum, item) => sum + item.quantity, 0),
    [orderItems],
  );

  const selectedShippingMethod = useMemo(
    () => shippingMethods.find((m) => m.id === shippingMethodId),
    [shippingMethods, shippingMethodId],
  );

  const shippingCost = useMemo(() => {
    if (!selectedShippingMethod) return 0;
    return selectedShippingMethod.basePrice / 100; // Convert cents to dollars
  }, [selectedShippingMethod]);

  const tax = useMemo(() => subtotal * 0.1, [subtotal]); // 10% GST for Australia
  const total = subtotal + shippingCost + tax;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Shipping Method Selection */}
        {orderItems.length > 0 && (
          <FormField
            control={control}
            name="shippingMethodId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Shipping Method</FormLabel>
                <FormControl>
                  {isLoadingShippingMethods ? (
                    <div className="flex items-center gap-2 py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-muted-foreground text-sm">
                        Loading shipping methods...
                      </span>
                    </div>
                  ) : (
                    <Select
                      value={field.value ? String(field.value) : undefined}
                      onValueChange={(value) =>
                        field.onChange(value === "none" ? null : Number(value))
                      }
                    >
                      <SelectTrigger className="w-full min-w-0">
                        <SelectValue placeholder="Select shipping method" />
                      </SelectTrigger>
                      <SelectContent>
                        {shippingMethods
                          .filter((m) => m.isActive)
                          .map((method) => (
                            <SelectItem
                              key={method.id}
                              value={String(method.id)}
                            >
                              {method.name} - $
                              {(method.basePrice / 100).toFixed(2)}
                              {method.description && ` (${method.description})`}
                            </SelectItem>
                          ))}
                        <SelectItem value="none">No shipping</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

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

          {orderItems.length > 0 && (
            <>
              {shippingCost > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-medium">
                    ${shippingCost.toFixed(2)}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax (10%)</span>
                <span className="font-medium">${tax.toFixed(2)}</span>
              </div>
            </>
          )}

          <Separator />

          {/* Total */}
          <div className="flex justify-between">
            <span className="font-semibold">Total</span>
            <span className="font-semibold">
              {orderItems.length === 0 ? "—" : `$${total.toFixed(2)}`}
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
              {orderItems.length === 0 ? "—" : `$${total.toFixed(2)}`}
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
