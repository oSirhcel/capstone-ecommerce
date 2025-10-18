"use client";

import { useForm, type Resolver } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField } from "@/components/ui/form";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const addressFormSchema = z.object({
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

type AddressFormData = {
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  isDefault: boolean;
};

interface AddressFormProps {
  type: "shipping" | "billing";
  onSubmit?: (values: AddressFormData) => void;
  onCancel?: () => void;
  initialData?: Partial<AddressFormData>;
  submitLabel?: string;
  isSubmitting?: boolean;
  showSaveOption?: boolean;
  onSaveForFuture?: (values: AddressFormData) => void;
  hideButtons?: boolean;
  form?: ReturnType<typeof useForm<AddressFormData>>;
  onChange?: (values: AddressFormData) => void;
}

export function AddressForm({
  type: _type = "shipping",
  onSubmit,
  onCancel,
  initialData,
  submitLabel = "Continue",
  isSubmitting = false,
  showSaveOption = false,
  onSaveForFuture: _onSaveForFuture,
  hideButtons = false,
  form: externalForm,
  onChange: _onChange,
}: AddressFormProps) {
  const internalForm = useForm<AddressFormData>({
    resolver: zodResolver(addressFormSchema) as Resolver<AddressFormData>,
    defaultValues: {
      firstName: initialData?.firstName ?? "",
      lastName: initialData?.lastName ?? "",
      addressLine1: initialData?.addressLine1 ?? "",
      addressLine2: initialData?.addressLine2 ?? "",
      city: initialData?.city ?? "",
      state: initialData?.state ?? "",
      postcode: initialData?.postcode ?? "",
      country: initialData?.country ?? "Australia",
      isDefault: initialData?.isDefault ?? false,
    },
  });

  const form = externalForm ?? internalForm;

  const handleSubmit = (values: AddressFormData) => {
    if (onSubmit) {
      onSubmit(values);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <FieldGroup className="gap-4">
          {/* Validation summary */}
          {Object.keys(form.formState.errors).length > 0 && (
            <div className="border-destructive bg-destructive/10 text-destructive rounded-md border p-3 text-sm">
              <span className="font-medium">Missing fields:</span>{" "}
              {Object.keys(form.formState.errors)
                .map((key) =>
                  key
                    .charAt(0)
                    .toUpperCase()
                    .concat(
                      key
                        .slice(1)
                        .replace(/([A-Z])/g, " $1")
                        .trim(),
                    ),
                )
                .join(", ")}
            </div>
          )}

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

          {showSaveOption && (
            <FormField
              control={form.control}
              name="isDefault"
              render={({ field, fieldState }) => (
                <Field
                  orientation="horizontal"
                  data-invalid={!!fieldState.error}
                >
                  <FormControl>
                    <Checkbox
                      id="isDefault"
                      checked={field.value}
                      onCheckedChange={(v) => field.onChange(Boolean(v))}
                    />
                  </FormControl>
                  <FieldLabel htmlFor="isDefault" className="font-normal">
                    Save this address for future use
                  </FieldLabel>
                </Field>
              )}
            />
          )}

          {!hideButtons && (
            <Field orientation="horizontal">
              <div className="ml-auto flex gap-2">
                {onCancel && (
                  <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                  </Button>
                )}
                <Button type="submit" disabled={isSubmitting}>
                  {submitLabel}
                </Button>
              </div>
            </Field>
          )}
        </FieldGroup>
      </form>
    </Form>
  );
}
