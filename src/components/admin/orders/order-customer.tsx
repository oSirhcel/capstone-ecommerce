import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Mail, Phone, User, MapPin } from "lucide-react";
import Link from "next/link";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

interface BillingAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

interface OrderCustomerProps {
  customer: Customer;
  shippingAddress?: ShippingAddress;
  billingAddress?: BillingAddress;
}

export function OrderCustomer({
  customer,
  shippingAddress,
  billingAddress,
}: OrderCustomerProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback>
              {customer.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{customer.name}</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="text-muted-foreground h-4 w-4" />
            <span>{customer.email}</span>
          </div>
          {customer.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="text-muted-foreground h-4 w-4" />
              <span>{customer.phone}</span>
            </div>
          )}
          <Link href={`/admin/users/${customer.id}`}>
            <Button
              variant="outline"
              size="sm"
              className="w-full bg-transparent"
            >
              <User className="mr-2 h-4 w-4" />
              View Customer Profile
            </Button>
          </Link>
        </div>

        {shippingAddress && (
          <>
            <Separator />
            <div className="space-y-2">
              <p className="text-sm font-medium">Shipping address</p>
              <div className="flex items-start gap-2">
                <MapPin className="text-muted-foreground mt-0.5 h-4 w-4 flex-shrink-0" />
                <div className="text-muted-foreground text-sm">
                  <p>{shippingAddress.street}</p>
                  <p>
                    {shippingAddress.city}, {shippingAddress.state}{" "}
                    {shippingAddress.zip}
                  </p>
                  <p>{shippingAddress.country}</p>
                </div>
              </div>
            </div>
          </>
        )}

        {billingAddress && (
          <>
            <Separator />
            <div className="space-y-2">
              <p className="text-sm font-medium">Billing address</p>
              <div className="flex items-start gap-2">
                <MapPin className="text-muted-foreground mt-0.5 h-4 w-4 flex-shrink-0" />
                <div className="text-muted-foreground text-sm">
                  <p>{billingAddress.street}</p>
                  <p>
                    {billingAddress.city}, {billingAddress.state}{" "}
                    {billingAddress.zip}
                  </p>
                  <p>{billingAddress.country}</p>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
