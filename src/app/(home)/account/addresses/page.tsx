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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, MoreVertical, MapPin, Edit, Trash2 } from "lucide-react";

import { toast } from "sonner";

interface Address {
  id: string;
  name: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone?: string;
  isDefault: boolean;
}

const mockAddresses: Address[] = [
  {
    id: "1",
    name: "John Smith",
    street: "42 George Street",
    city: "Sydney",
    state: "NSW",
    zipCode: "2000",
    country: "Australia",
    phone: "+61 2 9876 5432",
    isDefault: true,
  },
  {
    id: "2",
    name: "John Smith",
    street: "15 Crown Street",
    city: "Newcastle",
    state: "NSW",
    zipCode: "2300",
    country: "Australia",
    phone: "+61 2 4321 8765",
    isDefault: false,
  },
];

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>(mockAddresses);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "Australia",
    phone: "",
    isDefault: false,
  });

  const handleAddAddress = () => {
    setEditingAddress(null);
    setFormData({
      name: "",
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "Australia",
      phone: "",
      isDefault: false,
    });
    setIsDialogOpen(true);
  };

  //TODO: Add validation and API call

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address);
    setFormData({
      name: address.name,
      street: address.street,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      country: address.country,
      phone: address.phone ?? "",
      isDefault: address.isDefault,
    });
    setIsDialogOpen(true);
  };

  const handleDeleteAddress = (id: string) => {
    const addressToDelete = addresses.find((addr) => addr.id === id);
    const updatedAddresses = addresses.filter((addr) => addr.id !== id);

    // If deleting the default address and there are other addresses, make the first one default
    if (addressToDelete?.isDefault && updatedAddresses.length > 0) {
      updatedAddresses[0].isDefault = true;
    }

    setAddresses(updatedAddresses);
    toast.success("Address deleted successfully");
  };

  const handleSetDefault = (id: string) => {
    setAddresses((prev) =>
      prev.map((addr) => ({
        ...addr,
        isDefault: addr.id === id,
      })),
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingAddress) {
      // Update existing address
      setAddresses((prev) =>
        prev.map((addr) =>
          addr.id === editingAddress.id
            ? { ...addr, ...formData }
            : formData.isDefault
              ? { ...addr, isDefault: false }
              : addr,
        ),
      );
    } else {
      // Add new address
      const newAddress: Address = {
        id: Date.now().toString(),
        ...formData,
      };

      setAddresses((prev) => {
        if (formData.isDefault) {
          // Make all other addresses non-default
          return [
            ...prev.map((addr) => ({ ...addr, isDefault: false })),
            newAddress,
          ];
        }
        // If this is the first address, make it default
        if (prev.length === 0) {
          newAddress.isDefault = true;
        }
        return [...prev, newAddress];
      });
    }

    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Addresses</h1>
          <p className="text-muted-foreground">
            Manage your delivery addresses
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddAddress}>
              <Plus className="mr-2 h-4 w-4" />
              Add Address
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingAddress ? "Edit Address" : "Add New Address"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="street">Street Address</Label>
                  <Textarea
                    id="street"
                    value={formData.street}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        street: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, city: e.target.value }))
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        state: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="zipCode">ZIP Code</Label>
                  <Input
                    id="zipCode"
                    value={formData.zipCode}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        zipCode: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        country: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="phone">Phone Number (Optional)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="col-span-2 flex items-center space-x-2">
                  <Checkbox
                    id="isDefault"
                    checked={formData.isDefault}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        isDefault: checked as boolean,
                      }))
                    }
                  />
                  <Label htmlFor="isDefault">Set as default address</Label>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingAddress ? "Update Address" : "Add Address"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {addresses.map((address) => (
          <Card key={address.id}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <MapPin className="text-muted-foreground h-4 w-4" />
                <CardTitle className="text-base">{address.name}</CardTitle>
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
                      onClick={() => handleSetDefault(address.id)}
                    >
                      <MapPin className="mr-2 h-4 w-4" />
                      Set as Default
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={() => handleDeleteAddress(address.id)}
                    variant="destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent>
              <div className="text-muted-foreground space-y-1 text-sm">
                <p>{address.street}</p>
                <p>
                  {address.city}, {address.state} {address.zipCode}
                </p>
                <p>{address.country}</p>
                {address.phone && <p>{address.phone}</p>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {addresses.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MapPin className="text-muted-foreground mb-4 h-12 w-12" />
            <h3 className="mb-2 text-lg font-semibold">No addresses yet</h3>
            <p className="text-muted-foreground mb-4 text-center">
              Add your first delivery address to get started with ordering.
            </p>
            <Button onClick={handleAddAddress}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Address
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
