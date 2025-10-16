"use client";

import type React from "react";

import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField } from "@/components/ui/form";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Plus,
  MoreVertical,
  MapPin,
  Edit,
  Trash2,
  Package,
  CreditCard,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useAddresses,
  useCreateAddress,
  useUpdateAddress,
  useDeleteAddress,
  useSetDefaultAddress,
} from "@/hooks/use-addresses";
import type { Address } from "@/lib/api/addresses";

const addressFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  addressLine1: z.string().min(3, "Address is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  postalCode: z.string().min(2, "Postcode is required"),
  country: z.string().min(2, "Country is required"),
  isDefault: z.boolean().default(false),
});

type AddressFormData = z.input<typeof addressFormSchema>;

export default function AddressesPage() {
  const { data, isLoading, error } = useAddresses();
  const createAddressMutation = useCreateAddress();
  const updateAddressMutation = useUpdateAddress();
  const deleteAddressMutation = useDeleteAddress();
  const setDefaultMutation = useSetDefaultAddress();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [currentType, setCurrentType] = useState<"shipping" | "billing">(
    "shipping",
  );
  const form = useForm<AddressFormData>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "AU",
      isDefault: false,
    },
  });

  const addresses = data?.addresses ?? [];
  const shippingAddresses = addresses.filter(
    (addr) => addr.type === "shipping",
  );
  const billingAddresses = addresses.filter((addr) => addr.type === "billing");

  const handleAddAddress = (type: "shipping" | "billing") => {
    setCurrentType(type);
    setEditingAddress(null);
    form.reset({
      firstName: "",
      lastName: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "AU",
      isDefault: false,
    });
    setIsDialogOpen(true);
  };

  const handleEditAddress = (address: Address) => {
    setCurrentType(address.type);
    setEditingAddress(address);
    form.reset({
      firstName: address.firstName,
      lastName: address.lastName,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 ?? "",
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      isDefault: address.isDefault,
    });
    setIsDialogOpen(true);
  };

  const handleDeleteAddress = (id: number) => {
    if (window.confirm("Are you sure you want to delete this address?")) {
      deleteAddressMutation.mutate(id);
    }
  };

  const handleSetDefault = (id: number, type: "shipping" | "billing") => {
    setDefaultMutation.mutate({ id, type });
  };

  const onSubmit = async (values: AddressFormData) => {
    if (editingAddress) {
      await updateAddressMutation.mutateAsync(
        { id: editingAddress.id, ...values },
        { onSuccess: () => setIsDialogOpen(false) },
      );
    } else {
      await createAddressMutation.mutateAsync(
        { type: currentType, ...values },
        { onSuccess: () => setIsDialogOpen(false) },
      );
    }
  };

  const renderAddressList = (
    addressList: Address[],
    type: "shipping" | "billing",
  ) => {
    if (addressList.length === 0) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MapPin className="text-muted-foreground mb-4 h-12 w-12" />
            <h3 className="mb-2 text-lg font-semibold">
              No {type} addresses yet
            </h3>
            <p className="text-muted-foreground mb-4 text-center">
              Add your first {type} address to get started.
            </p>
            <Button onClick={() => handleAddAddress(type)}>
              <Plus className="mr-2 h-4 w-4" />
              Add {type === "shipping" ? "Shipping" : "Billing"} Address
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid gap-4">
        {addressList.map((address) => (
          <Card key={address.id}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <MapPin className="text-muted-foreground h-4 w-4" />
                <CardTitle className="text-base">
                  {address.firstName} {address.lastName}
                </CardTitle>
                {address.isDefault && (
                  <Badge variant="secondary">Default</Badge>
                )}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleEditAddress(address)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  {!address.isDefault && (
                    <DropdownMenuItem
                      onClick={() => handleSetDefault(address.id, address.type)}
                    >
                      <MapPin className="mr-2 h-4 w-4" />
                      Set as Default
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={() => handleDeleteAddress(address.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent>
              <div className="text-muted-foreground space-y-1 text-sm">
                <p>{address.addressLine1}</p>
                {address.addressLine2 && <p>{address.addressLine2}</p>}
                <p>
                  {address.city}, {address.state} {address.postalCode}
                </p>
                <p>{address.country}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Addresses</h1>
          <p className="text-muted-foreground">
            Manage your delivery and billing addresses
          </p>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Addresses</h1>
          <p className="text-red-600">
            Failed to load addresses. Please try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Addresses</h1>
          <p className="text-muted-foreground">
            Manage your delivery and billing addresses
          </p>
        </div>
      </div>

      <Tabs defaultValue="shipping" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="shipping" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Shipping Addresses
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Billing Addresses
          </TabsTrigger>
        </TabsList>

        <TabsContent value="shipping" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => handleAddAddress("shipping")}>
              <Plus className="mr-2 h-4 w-4" />
              Add Shipping Address
            </Button>
          </div>
          {renderAddressList(shippingAddresses, "shipping")}
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => handleAddAddress("billing")}>
              <Plus className="mr-2 h-4 w-4" />
              Add Billing Address
            </Button>
          </div>
          {renderAddressList(billingAddresses, "billing")}
        </TabsContent>
      </Tabs>

      {/* Address Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingAddress
                ? "Edit Address"
                : `Add ${currentType === "shipping" ? "Shipping" : "Billing"} Address`}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
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
                      <FieldLabel htmlFor="addressLine1">
                        Address line 1
                      </FieldLabel>
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
                      <FieldLabel htmlFor="addressLine2">
                        Address line 2
                      </FieldLabel>
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
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger id="state">
                              <SelectValue placeholder="Select state" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="NSW">
                                New South Wales
                              </SelectItem>
                              <SelectItem value="VIC">Victoria</SelectItem>
                              <SelectItem value="QLD">Queensland</SelectItem>
                              <SelectItem value="WA">
                                Western Australia
                              </SelectItem>
                              <SelectItem value="SA">
                                South Australia
                              </SelectItem>
                              <SelectItem value="TAS">Tasmania</SelectItem>
                              <SelectItem value="ACT">
                                Australian Capital Territory
                              </SelectItem>
                              <SelectItem value="NT">
                                Northern Territory
                              </SelectItem>
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
                    name="postalCode"
                    render={({ field, fieldState }) => (
                      <Field data-invalid={!!fieldState.error}>
                        <FieldLabel htmlFor="postalCode">Postcode</FieldLabel>
                        <FormControl>
                          <Input
                            id="postalCode"
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
                        Set as default address
                      </FieldLabel>
                    </Field>
                  )}
                />

                <Field orientation="horizontal">
                  <div className="ml-auto flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={
                        createAddressMutation.isPending ||
                        updateAddressMutation.isPending
                      }
                    >
                      {editingAddress ? "Update Address" : "Add Address"}
                    </Button>
                  </div>
                </Field>
              </FieldGroup>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
