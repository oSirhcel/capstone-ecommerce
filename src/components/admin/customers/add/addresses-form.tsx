"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { Separator } from "@/components/ui/separator";
import { MapPin, Plus, Trash2 } from "lucide-react";

const addressSchema = z.object({
  type: z.enum(["shipping", "billing"]),
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  company: z.string().optional(),
  address1: z.string().min(5, "Address is required"),
  address2: z.string().optional(),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State/Province is required"),
  zipCode: z.string().min(5, "ZIP/Postal code is required"),
  country: z.string().min(2, "Country is required"),
  phone: z.string().optional(),
  isDefault: z.boolean().default(false),
});

export type AddressData = z.infer<typeof addressSchema> & { id: string };

interface AddressesFormProps {
  addresses: AddressData[];
  onAddressesChange: (addresses: AddressData[]) => void;
}

export function AddressesForm({
  addresses,
  onAddressesChange,
}: AddressesFormProps) {
  const [showAddForm, setShowAddForm] = useState(false);

  const form = useForm<z.infer<typeof addressSchema>>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      type: "shipping",
      firstName: "",
      lastName: "",
      company: "",
      address1: "",
      address2: "",
      city: "",
      state: "",
      zipCode: "",
      country: "US",
      phone: "",
      isDefault: false,
    },
  });

  const onSubmit = (data: z.infer<typeof addressSchema>) => {
    const newAddress: AddressData = { ...data, id: Date.now().toString() };
    const updatedAddresses = [...addresses, newAddress];
    onAddressesChange(updatedAddresses);
    form.reset();
    setShowAddForm(false);
  };

  const removeAddress = (id: string) => {
    const updatedAddresses = addresses.filter((addr) => addr.id !== id);
    onAddressesChange(updatedAddresses);
  };

  const setAsDefault = (id: string, type: string) => {
    const updatedAddresses = addresses.map((addr) => ({
      ...addr,
      isDefault:
        addr.id === id && addr.type === type
          ? true
          : addr.type === type
            ? false
            : addr.isDefault,
    }));
    onAddressesChange(updatedAddresses);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Addresses
            </CardTitle>
            <CardDescription>
              Add shipping and billing addresses for the user
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowAddForm(true)}
            disabled={showAddForm}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Address
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Existing Addresses */}
        {addresses.length > 0 && (
          <div className="space-y-4">
            {addresses.map((address) => (
              <Card key={address.id} className="relative">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium capitalize">
                          {address.type} Address
                        </span>
                        {address.isDefault && (
                          <span className="bg-primary/10 text-primary rounded-full px-2 py-1 text-xs">
                            Default
                          </span>
                        )}
                      </div>
                      <div className="text-muted-foreground space-y-1 text-sm">
                        <p>
                          {address.firstName} {address.lastName}
                        </p>
                        {address.company && <p>{address.company}</p>}
                        <p>{address.address1}</p>
                        {address.address2 && <p>{address.address2}</p>}
                        <p>
                          {address.city}, {address.state} {address.zipCode}
                        </p>
                        <p>{address.country}</p>
                        {address.phone && <p>{address.phone}</p>}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {!address.isDefault && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setAsDefault(address.id, address.type)}
                        >
                          Set Default
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeAddress(address.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Add Address Form */}
        {showAddForm && (
          <>
            {addresses.length > 0 && <Separator />}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Add New Address</h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </Button>
              </div>

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="shipping">
                              Shipping Address
                            </SelectItem>
                            <SelectItem value="billing">
                              Billing Address
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            First Name{" "}
                            <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="John" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Last Name{" "}
                            <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Acme Inc." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Address <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="123 Main Street" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address2"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Apartment, suite, etc. (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Apt 4B" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 sm:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            City <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="New York" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            State/Province{" "}
                            <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="NY" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="zipCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            ZIP/Postal Code{" "}
                            <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="10001" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Country <span className="text-destructive">*</span>
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="US">United States</SelectItem>
                              <SelectItem value="CA">Canada</SelectItem>
                              <SelectItem value="UK">United Kingdom</SelectItem>
                              <SelectItem value="AU">Australia</SelectItem>
                              <SelectItem value="DE">Germany</SelectItem>
                              <SelectItem value="FR">France</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              type="tel"
                              placeholder="+1 (555) 123-4567"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="isDefault"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-y-0 space-x-3">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Set as default address</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-2">
                    <Button type="submit">Add Address</Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAddForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </>
        )}

        {addresses.length === 0 && !showAddForm && (
          <div className="text-muted-foreground py-8 text-center">
            <MapPin className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p>No addresses added yet</p>
            <p className="text-sm">Click "Add Address" to get started</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
