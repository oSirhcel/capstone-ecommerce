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

interface CustomerAddressesProps {
  customerId: string;
}

// Mock addresses data
const addresses = [
  {
    id: "1",
    type: "shipping",
    isDefault: true,
    firstName: "Sarah", 
    lastName: "Johnson",
    company: "",
    address1: "42 Wallaby Way",
    address2: "Unit 3",
    city: "Sydney",
    state: "NSW",
    zipCode: "2000",
    country: "Australia",
    phone: "+61 2 9876 5432",
  },
  {
    id: "2",
    type: "billing",
    isDefault: false,
    firstName: "Sarah",
    lastName: "Johnson",
    company: "Johnson Consulting",
    address1: "88 George Street",
    address2: "Level 12",
    city: "Parramatta",
    state: "NSW", 
    zipCode: "2150",
    country: "Australia",
    phone: "+61 2 9876 5432",
  },
];

export function CustomerAddresses({ customerId }: CustomerAddressesProps) {
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
        <div className="grid gap-4 md:grid-cols-2">
          {addresses.map((address) => (
            <Card key={address.id} className="relative">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          address.type === "shipping" ? "default" : "secondary"
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
                      {address.company && (
                        <p className="text-muted-foreground">
                          {address.company}
                        </p>
                      )}
                      <p className="text-muted-foreground">
                        {address.address1}
                      </p>
                      {address.address2 && (
                        <p className="text-muted-foreground">
                          {address.address2}
                        </p>
                      )}
                      <p className="text-muted-foreground">
                        {address.city}, {address.state} {address.zipCode}
                      </p>
                      <p className="text-muted-foreground">{address.country}</p>
                      <p className="text-muted-foreground">{address.phone}</p>
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
      </CardContent>
    </Card>
  );
}
