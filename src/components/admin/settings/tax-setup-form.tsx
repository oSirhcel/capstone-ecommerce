"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  useTaxSettingsQuery,
  useUpdateTaxSettingsMutation,
} from "@/hooks/admin/settings/use-tax-settings";

const taxSetupSchema = z.object({
  gstRegistered: z.boolean(),
  abn: z
    .string()
    .trim()
    .refine((val) => val === "" || /^\d{11}$/.test(val), {
      message: "ABN must be 11 digits",
    })
    .optional()
    .or(z.literal("")),
  businessName: z.string().trim().max(255).optional().or(z.literal("")),
  taxRate: z
    .number({ message: "Tax rate must be a number" })
    .min(0, "Min 0")
    .max(1, "Max 1"),
});

type TaxSetupFormValues = z.infer<typeof taxSetupSchema>;

export function TaxSetupForm() {
  const { data: settings, isLoading } = useTaxSettingsQuery();
  const updateMutation = useUpdateTaxSettingsMutation();

  const form = useForm<TaxSetupFormValues>({
    resolver: zodResolver(taxSetupSchema),
    values: settings
      ? {
          gstRegistered: settings.gstRegistered ?? false,
          abn: settings.abn ?? "",
          businessName: settings.businessName ?? "",
          taxRate: Number(settings.taxRate ?? 0.1),
        }
      : undefined,
    defaultValues: {
      gstRegistered: false,
      abn: "",
      businessName: "",
      taxRate: 0.1,
    },
  });

  async function onSubmit(values: TaxSetupFormValues) {
    await updateMutation.mutateAsync(values);
  }

  return (
    <Card className="border shadow-sm">
      <CardHeader className="space-y-1.5 pb-6">
        <CardTitle className="text-xl font-semibold">
          Business Information
        </CardTitle>
        <CardDescription className="leading-relaxed text-balance">
          Manage your tax registration and business details
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="businessName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium">Business Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Your registered business name"
                      {...field}
                      disabled={isLoading || updateMutation.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="abn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium">ABN</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="11 digit ABN"
                      {...field}
                      disabled={isLoading || updateMutation.isPending}
                    />
                  </FormControl>
                  <FormDescription className="leading-relaxed">
                    Australian Business Number (11 digits)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-6 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="taxRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">Tax Rate</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min={0}
                        max={1}
                        value={field.value}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        disabled={isLoading || updateMutation.isPending}
                      />
                    </FormControl>
                    <FormDescription className="leading-relaxed">
                      Default GST is 0.10 (10%)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gstRegistered"
                render={({ field }) => (
                  <FormItem>
                    <div></div>
                    <div className="flex items-center justify-between rounded-lg border p-2">
                      <FormLabel className="font-medium">
                        GST Registered
                      </FormLabel>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isLoading || updateMutation.isPending}
                        />
                      </FormControl>
                    </div>
                    <FormDescription className="leading-relaxed"></FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end border-t pt-4">
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                className="min-w-[120px]"
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
