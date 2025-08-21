"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, User, MapPin, Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  CustomerData,
  ShippingAddress,
} from "@/app/admin/orders/create/page";

const mockCustomers = [
  {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    phone: "+1 (555) 123-4567",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: "2",
    name: "Sarah Johnson",
    email: "sarah@example.com",
    phone: "+1 (555) 234-5678",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: "3",
    name: "Mike Chen",
    email: "mike@example.com",
    phone: "+1 (555) 345-6789",
    avatar: "/placeholder.svg?height=40&width=40",
  },
];

interface CustomerSelectionFormProps {
  customer: CustomerData | null;
  onCustomerChange: (customer: CustomerData | null) => void;
  shippingAddress: ShippingAddress;
  onShippingAddressChange: (address: ShippingAddress) => void;
}

export function CustomerSelectionForm({
  customer,
  onCustomerChange,
  shippingAddress,
  onShippingAddressChange,
}: CustomerSelectionFormProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showCustomerSearch, setShowCustomerSearch] = useState(!customer);

  const filteredCustomers = mockCustomers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleCustomerSelect = (selectedCustomer: CustomerData) => {
    onCustomerChange(selectedCustomer);
    setShowCustomerSearch(false);

    // Auto-fill shipping address with customer name
    onShippingAddressChange({
      ...shippingAddress,
      firstName: selectedCustomer.name.split(" ")[0] || "",
      lastName: selectedCustomer.name.split(" ").slice(1).join(" ") || "",
    });
  };

  const handleAddressChange = (field: keyof ShippingAddress, value: string) => {
    onShippingAddressChange({
      ...shippingAddress,
      [field]: value,
    });
  };

  return (
    <div className="space-y-6">
      {/* Customer Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Information
              </CardTitle>
              <CardDescription>Select or search for a customer</CardDescription>
            </div>
            {customer && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowCustomerSearch(true);
                  onCustomerChange(null);
                }}
              >
                Change Customer
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {showCustomerSearch ? (
            <div className="space-y-4">
              <div className="relative">
                <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
                <Input
                  placeholder="Search customers by name or email..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="max-h-60 space-y-2 overflow-y-auto">
                {filteredCustomers.map((c) => (
                  <div
                    key={c.id}
                    className="hover:bg-muted/50 flex cursor-pointer items-center gap-3 rounded-lg border p-3"
                    onClick={() => handleCustomerSelect(c)}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={c.avatar || "/placeholder.svg"}
                        alt={c.name}
                      />
                      <AvatarFallback>{c.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{c.name}</p>
                      <p className="text-muted-foreground text-sm">{c.email}</p>
                      <p className="text-muted-foreground text-sm">{c.phone}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Button variant="outline" className="w-full bg-transparent">
                <Plus className="mr-2 h-4 w-4" />
                Create New Customer
              </Button>
            </div>
          ) : customer ? (
            <div className="bg-muted/20 flex items-center gap-4 rounded-lg border p-4">
              <Avatar className="h-12 w-12">
                <AvatarImage
                  src={customer.avatar || "/placeholder.svg"}
                  alt={customer.name}
                />
                <AvatarFallback>{customer.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium">{customer.name}</p>
                <p className="text-muted-foreground text-sm">
                  {customer.email}
                </p>
                <p className="text-muted-foreground text-sm">
                  {customer.phone}
                </p>
              </div>
              <Badge>Selected</Badge>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Shipping Address */}
      {customer && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Shipping Address
            </CardTitle>
            <CardDescription>
              Enter the delivery address for this order
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={shippingAddress.firstName}
                  onChange={(e) =>
                    handleAddressChange("firstName", e.target.value)
                  }
                  placeholder="John"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={shippingAddress.lastName}
                  onChange={(e) =>
                    handleAddressChange("lastName", e.target.value)
                  }
                  placeholder="Doe"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="company">Company (Optional)</Label>
              <Input
                id="company"
                value={shippingAddress.company || ""}
                onChange={(e) => handleAddressChange("company", e.target.value)}
                placeholder="Acme Inc."
              />
            </div>

            <div>
              <Label htmlFor="address1">Address *</Label>
              <Input
                id="address1"
                value={shippingAddress.address1}
                onChange={(e) =>
                  handleAddressChange("address1", e.target.value)
                }
                placeholder="123 Main Street"
              />
            </div>

            <div>
              <Label htmlFor="address2">
                Apartment, suite, etc. (Optional)
              </Label>
              <Input
                id="address2"
                value={shippingAddress.address2 || ""}
                onChange={(e) =>
                  handleAddressChange("address2", e.target.value)
                }
                placeholder="Apt 4B"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={shippingAddress.city}
                  onChange={(e) => handleAddressChange("city", e.target.value)}
                  placeholder="New York"
                />
              </div>
              <div>
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  value={shippingAddress.state}
                  onChange={(e) => handleAddressChange("state", e.target.value)}
                  placeholder="NY"
                />
              </div>
              <div>
                <Label htmlFor="zipCode">ZIP Code *</Label>
                <Input
                  id="zipCode"
                  value={shippingAddress.zipCode}
                  onChange={(e) =>
                    handleAddressChange("zipCode", e.target.value)
                  }
                  placeholder="10001"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="country">Country *</Label>
                <Select
                  value={shippingAddress.country}
                  onValueChange={(value) =>
                    handleAddressChange("country", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="US">United States</SelectItem>
                    <SelectItem value="CA">Canada</SelectItem>
                    <SelectItem value="UK">United Kingdom</SelectItem>
                    <SelectItem value="AU">Australia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="phone">Phone (Optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={shippingAddress.phone || ""}
                  onChange={(e) => handleAddressChange("phone", e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
