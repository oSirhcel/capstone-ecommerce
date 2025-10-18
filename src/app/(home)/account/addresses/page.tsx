"use client";

import type React from "react";

import { useState } from "react";
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
  useAddresses,
  useCreateAddress,
  useUpdateAddress,
  useDeleteAddress,
  useSetDefaultAddress,
} from "@/hooks/use-addresses";
import { AddressForm } from "@/components/checkout/address-form";
import type {
  Address,
  CreateAddressInput,
  UpdateAddressInput,
} from "@/lib/api/addresses";

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

  const addresses = data?.addresses ?? [];
  const shippingAddresses = addresses.filter(
    (addr) => addr.type === "shipping",
  );
  const billingAddresses = addresses.filter((addr) => addr.type === "billing");

  const handleAddAddress = (type: "shipping" | "billing") => {
    setCurrentType(type);
    setEditingAddress(null);
    setIsDialogOpen(true);
  };

  const handleEditAddress = (address: Address) => {
    setCurrentType(address.type);
    setEditingAddress(address);
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

  const onSubmit = async (values: {
    firstName: string;
    lastName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
    isDefault: boolean;
  }) => {
    if (editingAddress) {
      await updateAddressMutation.mutateAsync(
        { id: editingAddress.id, ...values } as UpdateAddressInput,
        { onSuccess: () => setIsDialogOpen(false) },
      );
    } else {
      await createAddressMutation.mutateAsync(
        { type: currentType, ...values } as CreateAddressInput,
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
                  {address.city}, {address.state} {address.postcode}
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
          <AddressForm
            type={currentType}
            onSubmit={onSubmit}
            onCancel={() => setIsDialogOpen(false)}
            initialData={
              editingAddress
                ? {
                    firstName: editingAddress.firstName,
                    lastName: editingAddress.lastName,
                    addressLine1: editingAddress.addressLine1,
                    addressLine2: editingAddress.addressLine2 ?? "",
                    city: editingAddress.city,
                    state: editingAddress.state,
                    postcode: editingAddress.postcode,
                    country: editingAddress.country,
                    isDefault: editingAddress.isDefault,
                  }
                : undefined
            }
            submitLabel={editingAddress ? "Update Address" : "Add Address"}
            isSubmitting={
              createAddressMutation.isPending || updateAddressMutation.isPending
            }
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
