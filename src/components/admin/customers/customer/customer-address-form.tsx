"use client";

import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";

const addressFormSchema = z.object({
  type: z.enum(["shipping", "billing"]),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  addressLine1: z.string().min(3, "Address is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  postcode: z.string().min(2, "Postcode is required"),
  country: z.string().min(2, "Country is required"),
  isDefault: z.boolean().default(false),
});

export type AdminCustomerAddressFormValues = z.input<typeof addressFormSchema>;

type AdminCustomerAddressFormProps = {
  defaultValues?: Partial<AdminCustomerAddressFormValues>;
  onSubmit: (values: AdminCustomerAddressFormValues) => void;
  submitLabel?: string;
  isSubmitting?: boolean;
};

export function AdminCustomerAddressForm({
  defaultValues,
  onSubmit,
  submitLabel = "Save",
  isSubmitting,
}: AdminCustomerAddressFormProps) {
  const form = useForm<AdminCustomerAddressFormValues>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: {
      type: "shipping",
      firstName: "",
      lastName: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      postcode: "",
      country: "AU",
      isDefault: false,
      ...defaultValues,
    },
  });

  const errors = form.formState.errors;
  const hasErrors = Object.keys(errors).length > 0;

  const missingFields = Object.keys(errors)
    .map(
      (key) =>
        key.charAt(0).toUpperCase() +
        key
          .slice(1)
          .replace(/([A-Z])/g, " $1")
          .trim(),
    )
    .join(", ");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((values) => onSubmit(values))}>
        <FieldGroup className="gap-4">
          {hasErrors && (
            <div className="border-destructive bg-destructive/10 text-destructive rounded-md border p-3 text-sm">
              <span className="font-medium">Missing fields:</span>{" "}
              {missingFields}
            </div>
          )}

          <FormField
            control={form.control}
            name="type"
            render={({ field, fieldState }) => (
              <Field data-invalid={!!fieldState.error}>
                <FieldLabel htmlFor="type">Type</FieldLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="shipping">Shipping</SelectItem>
                      <SelectItem value="billing">Billing</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FieldDescription>
                  Choose whether this is a shipping or billing address
                </FieldDescription>
              </Field>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field, fieldState }) => (
                <Field data-invalid={!!fieldState.error}>
                  <FieldLabel htmlFor="firstName">First name</FieldLabel>
                  <FormControl>
                    <Input
                      id="firstName"
                      {...field}
                      aria-invalid={!!fieldState.error}
                    />
                  </FormControl>
                </Field>
              )}
            />

            <FormField
              control={form.control}
              name="lastName"
              render={({ field, fieldState }) => (
                <Field data-invalid={!!fieldState.error}>
                  <FieldLabel htmlFor="lastName">Last name</FieldLabel>
                  <FormControl>
                    <Input
                      id="lastName"
                      {...field}
                      aria-invalid={!!fieldState.error}
                    />
                  </FormControl>
                </Field>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="addressLine1"
            render={({ field, fieldState }) => (
              <Field data-invalid={!!fieldState.error}>
                <FieldLabel htmlFor="addressLine1">Address line 1</FieldLabel>
                <FormControl>
                  <Input
                    id="addressLine1"
                    {...field}
                    aria-invalid={!!fieldState.error}
                    placeholder="Street address, P.O. box"
                  />
                </FormControl>
              </Field>
            )}
          />

          <FormField
            control={form.control}
            name="addressLine2"
            render={({ field, fieldState }) => (
              <Field data-invalid={!!fieldState.error}>
                <FieldLabel htmlFor="addressLine2">Address line 2</FieldLabel>
                <FormControl>
                  <Input
                    id="addressLine2"
                    {...field}
                    aria-invalid={!!fieldState.error}
                    placeholder="Apartment, suite, unit, building, floor, etc. (optional)"
                  />
                </FormControl>
              </Field>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="city"
              render={({ field, fieldState }) => (
                <Field data-invalid={!!fieldState.error}>
                  <FieldLabel htmlFor="city">City</FieldLabel>
                  <FormControl>
                    <Input
                      id="city"
                      {...field}
                      aria-invalid={!!fieldState.error}
                    />
                  </FormControl>
                </Field>
              )}
            />

            <FormField
              control={form.control}
              name="state"
              render={({ field, fieldState }) => (
                <Field data-invalid={!!fieldState.error}>
                  <FieldLabel htmlFor="state">State</FieldLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="state">
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NSW">New South Wales</SelectItem>
                        <SelectItem value="VIC">Victoria</SelectItem>
                        <SelectItem value="QLD">Queensland</SelectItem>
                        <SelectItem value="WA">Western Australia</SelectItem>
                        <SelectItem value="SA">South Australia</SelectItem>
                        <SelectItem value="TAS">Tasmania</SelectItem>
                        <SelectItem value="ACT">
                          Australian Capital Territory
                        </SelectItem>
                        <SelectItem value="NT">Northern Territory</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                </Field>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="postcode"
              render={({ field, fieldState }) => (
                <Field data-invalid={!!fieldState.error}>
                  <FieldLabel htmlFor="postcode">Postcode</FieldLabel>
                  <FormControl>
                    <Input
                      id="postcode"
                      {...field}
                      aria-invalid={!!fieldState.error}
                    />
                  </FormControl>
                </Field>
              )}
            />

            <FormField
              control={form.control}
              name="country"
              render={({ field, fieldState }) => (
                <Field data-invalid={!!fieldState.error}>
                  <FieldLabel htmlFor="country">Country</FieldLabel>
                  <FormControl>
                    <Input
                      id="country"
                      {...field}
                      aria-invalid={!!fieldState.error}
                    />
                  </FormControl>
                </Field>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="isDefault"
            render={({ field, fieldState }) => (
              <Field orientation="horizontal" data-invalid={!!fieldState.error}>
                <FormControl>
                  <Checkbox
                    id="isDefault"
                    checked={field.value}
                    onCheckedChange={(v) => field.onChange(Boolean(v))}
                  />
                </FormControl>
                <FieldLabel htmlFor="isDefault" className="font-normal">
                  Set as default address
                </FieldLabel>
              </Field>
            )}
          />

          <Field orientation="horizontal">
            <Button type="submit" disabled={isSubmitting}>
              {submitLabel}
            </Button>
          </Field>
        </FieldGroup>
      </form>
    </Form>
  );
}
