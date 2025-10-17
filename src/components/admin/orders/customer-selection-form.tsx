"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useFormContext } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type {
  OrderFormValues,
  CustomerData,
} from "@/app/admin/orders/create/page";
import { fetchCustomers } from "@/lib/api/admin/customers";
import { useCustomerAddresses } from "@/hooks/admin/customers/use-customer-addresses";
import { useDebounce } from "@/hooks/use-debounce";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

interface CustomerSelectionFormProps {
  storeId: string;
}

export function CustomerSelectionForm({ storeId }: CustomerSelectionFormProps) {
  const { watch, setValue, control } = useFormContext<OrderFormValues>();
  const customer = watch("customer");
  const selectedAddressId = watch("selectedAddressId");

  const [searchTerm, setSearchTerm] = useState("");
  const [showCustomerSearch, setShowCustomerSearch] = useState(!customer);
  const [addressMode, setAddressMode] = useState<"select" | "manual">("select");
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Fetch customers with search
  const { data: customersData, isLoading: isLoadingCustomers } = useQuery({
    queryKey: ["admin-customers", storeId, debouncedSearch],
    queryFn: () =>
      fetchCustomers({
        storeId,
        search: debouncedSearch || undefined,
        limit: 10,
        page: 1,
        sortBy: "joinDate",
        sortOrder: "desc",
      }),
    enabled: showCustomerSearch && !!storeId,
  });

  // Fetch customer addresses when a customer is selected
  const { data: addressesData, isLoading: isLoadingAddresses } =
    useCustomerAddresses(customer?.id ?? null, storeId);

  const customers = useMemo(
    () => customersData?.customers ?? [],
    [customersData],
  );

  const addresses = useMemo(
    () => addressesData?.addresses ?? [],
    [addressesData],
  );

  const handleCustomerSelect = (selectedCustomer: {
    id: string;
    name: string;
    email: string;
  }) => {
    const customerData: CustomerData = {
      id: selectedCustomer.id,
      name: selectedCustomer.name,
      email: selectedCustomer.email,
      phone: "",
    };
    setValue("customer", customerData);
    setShowCustomerSearch(false);
    setAddressMode("select");
    setValue("selectedAddressId", null);

    // Reset address form
    setValue("shippingAddress", {
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
    });
  };

  const handleAddressSelect = (addressId: string) => {
    if (addressId === "manual") {
      setAddressMode("manual");
      setValue("selectedAddressId", null);
      // Clear form for manual entry
      setValue("shippingAddress", {
        firstName: customer?.name.split(" ")[0] ?? "",
        lastName: customer?.name.split(" ").slice(1).join(" ") ?? "",
        company: "",
        address1: "",
        address2: "",
        city: "",
        state: "",
        zipCode: "",
        country: "US",
        phone: "",
      });
    } else {
      const selectedAddress = addresses.find((a) => a.id === Number(addressId));
      if (selectedAddress) {
        setAddressMode("select");
        setValue("selectedAddressId", selectedAddress.id);
        // Populate form with selected address (but allow editing)
        setValue("shippingAddress", {
          firstName: selectedAddress.firstName,
          lastName: selectedAddress.lastName,
          company: "",
          address1: selectedAddress.addressLine1,
          address2: selectedAddress.addressLine2 ?? "",
          city: selectedAddress.city,
          state: selectedAddress.state,
          zipCode: selectedAddress.postalCode,
          country: selectedAddress.country,
          phone: "",
        });
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Customer Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Customer</CardTitle>
            {customer && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowCustomerSearch(true);
                  setValue("customer", null);
                }}
              >
                Change
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {showCustomerSearch ? (
            <div className="space-y-3">
              <div className="relative">
                <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
                <Input
                  placeholder="Search customers..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="max-h-48 space-y-2 overflow-y-auto">
                {isLoadingCustomers ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                ) : customers.length > 0 ? (
                  customers.map((c) => (
                    <div
                      key={c.id}
                      className="hover:bg-muted/50 flex cursor-pointer items-center gap-2 rounded-md border p-2 transition-colors"
                      onClick={() => handleCustomerSelect(c)}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {c.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{c.name}</p>
                        <p className="text-muted-foreground truncate text-xs">
                          {c.email}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground py-6 text-center text-sm">
                    No customers found
                  </p>
                )}
              </div>
            </div>
          ) : customer ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {customer.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {customer.name}
                  </p>
                  <p className="text-muted-foreground truncate text-xs">
                    {customer.email}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              Select a customer to continue
            </p>
          )}
        </CardContent>
      </Card>

      {/* Shipping Address */}
      {customer && (
        <Card>
          <CardHeader>
            <CardTitle>Shipping address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Address Selection */}
            {isLoadingAddresses ? (
              <div className="flex items-center gap-2 py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-muted-foreground text-sm">
                  Loading addresses...
                </span>
              </div>
            ) : (
              <Select
                value={
                  selectedAddressId
                    ? String(selectedAddressId)
                    : addressMode === "manual"
                      ? "manual"
                      : ""
                }
                onValueChange={handleAddressSelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select or enter address" />
                </SelectTrigger>
                <SelectContent>
                  {addresses.map((addr) => (
                    <SelectItem key={addr.id} value={String(addr.id)}>
                      {addr.firstName} {addr.lastName} - {addr.addressLine1},{" "}
                      {addr.city}, {addr.state} {addr.postalCode}
                      {addr.isDefault && " (Default)"}
                    </SelectItem>
                  ))}
                  <SelectItem value="manual">Enter address manually</SelectItem>
                </SelectContent>
              </Select>
            )}
            <div className="grid gap-3">
              <FormField
                control={control}
                name="shippingAddress.firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="shippingAddress.lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={control}
              name="shippingAddress.company"
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
              control={control}
              name="shippingAddress.address1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address *</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Main Street" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="shippingAddress.address2"
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

            <FormField
              control={control}
              name="shippingAddress.city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City *</FormLabel>
                  <FormControl>
                    <Input placeholder="New York" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={control}
                name="shippingAddress.state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State *</FormLabel>
                    <FormControl>
                      <Input placeholder="NY" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="shippingAddress.zipCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ZIP Code *</FormLabel>
                    <FormControl>
                      <Input placeholder="10001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={control}
              name="shippingAddress.country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
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
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="shippingAddress.phone"
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}
