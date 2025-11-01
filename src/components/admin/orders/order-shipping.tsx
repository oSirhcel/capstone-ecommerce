import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, MapPin, Calendar } from "lucide-react";

interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

interface Shipping {
  method: string;
  cost: number;
  estimatedDelivery: string;
  address: ShippingAddress;
}

interface OrderShippingProps {
  shipping: Shipping;
}

export function OrderShipping({ shipping }: OrderShippingProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Shipping Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Truck className="text-muted-foreground h-4 w-4" />
            <span>{shipping.method}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="text-muted-foreground h-4 w-4" />
            <span>
              Est. delivery:{" "}
              {new Date(shipping.estimatedDelivery).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="flex items-start gap-2">
            <MapPin className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
            <div className="min-w-0 flex-1 text-sm break-words">
              <p className="break-words">{shipping.address.street}</p>
              <p className="break-words">
                {shipping.address.city}, {shipping.address.state}{" "}
                {shipping.address.zip}
              </p>
              <p className="break-words">{shipping.address.country}</p>
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="flex items-center justify-between text-sm">
            <span>Shipping Cost</span>
            <span className="font-semibold">${shipping.cost.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
