"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Edit, Trash2, Plus } from "lucide-react";
import { useCustomerDetail } from "@/contexts/customer-detail-context";
import { useCustomerAddressesQuery } from "@/hooks/admin/customers/use-customer-addresses-query";
import { useSession } from "next-auth/react";

export function CustomerAddresses() {
  const { customerId } = useCustomerDetail();
  const session = useSession();
  const storeId = session.data?.store?.id ?? "";

  const { data, isLoading, error } = useCustomerAddressesQuery({
    customerId,
    storeId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Addresses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-32 items-center justify-center">
            <p className="text-muted-foreground text-sm">
              Loading addresses...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Addresses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-32 items-center justify-center">
            <p className="text-destructive text-sm">Failed to load addresses</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const addresses = data?.addresses ?? [];

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
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Address
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {addresses.length === 0 ? (
          <div className="flex h-32 items-center justify-center">
            <p className="text-muted-foreground text-sm">No addresses found</p>
          </div>
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
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive h-8 w-8"
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
