"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  useCreateShippingMethodMutation,
  useUpdateShippingMethodMutation,
} from "@/hooks/admin/settings/use-shipping-methods";
import { QuantityInput } from "@/components/ui/quantity-input";
import { MoneyInput } from "@/components/ui/money-input";

const shippingMethodSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).nullable().optional(),
  basePrice: z.number().min(0),
  estimatedDays: z.number().min(1),
  isActive: z.boolean(),
});

type ShippingMethodFormValues = z.infer<typeof shippingMethodSchema>;

export function ShippingMethodForm({
  initial,
  onSuccess,
}: {
  initial?: Partial<ShippingMethodFormValues> & { id?: number };
  onSuccess?: () => void;
}) {
  const createMutation = useCreateShippingMethodMutation();
  const updateMutation = useUpdateShippingMethodMutation();

  const form = useForm<ShippingMethodFormValues>({
    resolver: zodResolver(shippingMethodSchema),
    defaultValues: {
      name: initial?.name ?? "",
      description: initial?.description ?? null,
      // Convert from cents to dollars for display
      basePrice: initial?.basePrice ? initial.basePrice / 100 : 0,
      estimatedDays: initial?.estimatedDays ?? 3,
      isActive: initial?.isActive ?? true,
    },
  });

  async function onSubmit(values: ShippingMethodFormValues) {
    // Convert dollars to cents for API
    const payload = {
      ...values,
      basePrice: Math.round(values.basePrice * 100), // Convert dollars to cents
      description: values.description ?? null,
    };
    if (initial?.id) {
      await updateMutation.mutateAsync({ id: initial.id, ...payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    onSuccess?.();
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="Standard Shipping"
                  {...field}
                  disabled={isPending}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input
                  placeholder="3-5 business days"
                  {...field}
                  value={field.value ?? ""}
                  disabled={isPending}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="basePrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Base Price (AUD)</FormLabel>
                <FormControl>
                  <MoneyInput
                    value={field.value != null ? field.value * 100 : null}
                    onChange={(cents) =>
                      field.onChange(cents == null ? null : cents / 100)
                    }
                    disabled={isPending}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="estimatedDays"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estimated Days</FormLabel>
                <FormControl>
                  <QuantityInput
                    step={1}
                    min={1}
                    decimalPlaces={0}
                    value={field.value ?? 0}
                    onChange={(value) => field.onChange(value)}
                    disabled={isPending}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-md border p-3">
                <FormLabel>Active</FormLabel>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isPending}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : initial?.id ? "Save" : "Create"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
