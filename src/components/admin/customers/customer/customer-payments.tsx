import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditCard, Edit, Trash2, Plus } from "lucide-react";

interface CustomerPaymentsProps {
  customerId: string;
}

// Mock payment methods data
const paymentMethods = [
  {
    id: "1",
    type: "card",
    brand: "visa",
    last4: "4242",
    expiryMonth: 12,
    expiryYear: 2025,
    isDefault: true,
    holderName: "Sarah Johnson",
  },
  {
    id: "2",
    type: "card",
    brand: "mastercard",
    last4: "8888",
    expiryMonth: 8,
    expiryYear: 2026,
    isDefault: false,
    holderName: "Sarah Johnson",
  },
];

const getBrandIcon = (brand: string) => {
  // In a real app, you'd use actual brand icons
  return brand.toUpperCase();
};

export function CustomerPayments({ customerId }: CustomerPaymentsProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Methods
            </CardTitle>
            <CardDescription>Customer saved payment methods</CardDescription>
          </div>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Payment Method
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {paymentMethods.map((method) => (
            <Card key={method.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-muted flex h-10 w-16 items-center justify-center rounded border text-xs font-medium">
                      {getBrandIcon(method.brand)}
                    </div>
                    <div>
                      <p className="font-medium">
                        •••• •••• •••• {method.last4}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        Expires {method.expiryMonth.toString().padStart(2, "0")}
                        /{method.expiryYear}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {method.holderName}
                      </p>
                    </div>
                    {method.isDefault && (
                      <Badge variant="outline" className="ml-2">
                        Default
                      </Badge>
                    )}
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
