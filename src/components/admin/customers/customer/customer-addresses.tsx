"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { type CustomerAddress } from "@/lib/api/admin/customers";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Edit, MapPin, Plus, Trash2 } from "lucide-react";
import type { AdminCustomerAddressFormValues } from "./customer-address-form";
import { AdminCustomerAddressForm } from "./customer-address-form";
import {
  useCustomerAddresses,
  useCreateCustomerAddress,
  useUpdateCustomerAddress,
  useDeleteCustomerAddress,
} from "@/hooks/admin/customers/use-customer-addresses";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";

interface Props {
  customerId: string;
  storeId: string;
}

export function CustomerAddresses({ customerId, storeId }: Props) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] =
    useState<CustomerAddress | null>(null);

  const { data } = useCustomerAddresses(customerId, storeId);
  const addresses = data?.addresses ?? [];

  const createMutation = useCreateCustomerAddress(customerId, storeId);
  const updateMutation = useUpdateCustomerAddress(customerId, storeId);
  const deleteMutation = useDeleteCustomerAddress(customerId, storeId);

  function onDelete(addr: CustomerAddress) {
    deleteMutation.mutate(addr, {
      onSuccess: () => toast.success("Address deleted"),
      onError: () => toast.error("Failed to delete address"),
    });
  }

  function openCreateDialog() {
    setSelectedAddress(null);
    setIsDialogOpen(true);
  }

  function openEditDialog(addr: CustomerAddress) {
    setSelectedAddress(addr);
    setIsDialogOpen(true);
  }

  function handleSubmit(values: AdminCustomerAddressFormValues) {
    if (selectedAddress) {
      updateMutation.mutate(
        {
          id: selectedAddress.id,
          values: { ...values, id: selectedAddress.id },
        },
        {
          onSuccess: () => {
            toast.success("Address updated");
            setIsDialogOpen(false);
            setSelectedAddress(null);
          },
          onError: () => toast.error("Failed to update address"),
        },
      );
    } else {
      createMutation.mutate(
        { ...values, isDefault: values.isDefault ?? false },
        {
          onSuccess: () => {
            toast.success("Address added");
            setIsDialogOpen(false);
          },
          onError: () => toast.error("Failed to add address"),
        },
      );
    }
  }

  const defaultValues: Partial<AdminCustomerAddressFormValues> | undefined =
    selectedAddress
      ? {
          type: selectedAddress.type === "billing" ? "billing" : "shipping",
          firstName: selectedAddress.firstName,
          lastName: selectedAddress.lastName,
          addressLine1: selectedAddress.addressLine1,
          addressLine2: selectedAddress.addressLine2 ?? undefined,
          city: selectedAddress.city,
          state: selectedAddress.state,
          postalCode: selectedAddress.postalCode,
          country: selectedAddress.country,
          isDefault: selectedAddress.isDefault,
        }
      : undefined;

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
              Customer shipping and billing addresses
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Add Address
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {selectedAddress ? "Edit address" : "Add an address"}
                </DialogTitle>
              </DialogHeader>
              <AdminCustomerAddressForm
                defaultValues={defaultValues}
                onSubmit={handleSubmit}
                submitLabel={
                  selectedAddress
                    ? updateMutation.isPending
                      ? "Saving..."
                      : "Save Changes"
                    : createMutation.isPending
                      ? "Adding..."
                      : "Add Address"
                }
                isSubmitting={
                  selectedAddress
                    ? updateMutation.isPending
                    : createMutation.isPending
                }
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {addresses.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <MapPin />
              </EmptyMedia>
              <EmptyTitle>No addresses</EmptyTitle>
              <EmptyDescription>
                This customer hasn&apos;t added any addresses yet. Add a
                shipping or billing address to get started.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Add Address
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {addresses.map((address) => (
              <Card key={address.id} className="relative">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            address.type === "shipping"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {address.type === "shipping" ? "Shipping" : "Billing"}
                        </Badge>
                        {address.isDefault && (
                          <Badge variant="outline" className="text-xs">
                            Default
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-1 text-sm">
                        <p className="font-medium">
                          {address.firstName} {address.lastName}
                        </p>
                        {/* company not available on address type */}
                        <p className="text-muted-foreground">
                          {address.addressLine1}
                        </p>
                        {address.addressLine2 && (
                          <p className="text-muted-foreground">
                            {address.addressLine2}
                          </p>
                        )}
                        <p className="text-muted-foreground">
                          {address.city}, {address.state} {address.postalCode}
                        </p>
                        <p className="text-muted-foreground">
                          {address.country}
                        </p>
                        {/* phone not available on address type */}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEditDialog(address)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive h-8 w-8"
                        onClick={() => onDelete(address)}
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
      </CardContent>
    </Card>
  );
}
