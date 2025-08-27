import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, MapPin } from "lucide-react";

interface BillingAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

interface Payment {
  method: string;
  last4: string;
  billingAddress: BillingAddress;
}

interface OrderPaymentProps {
  payment: Payment;
  total: number;
}

export function OrderPayment({ payment, total }: OrderPaymentProps) {
  const subtotal = total - 12.0; // Assuming $12 shipping
  const tax = subtotal * 0.08; // 8% tax
  const shipping = 12.0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm">
          <CreditCard className="text-muted-foreground h-4 w-4" />
          <span>
            {payment.method} ending in {payment.last4}
          </span>
        </div>

        <div className="border-t pt-4">
          <h4 className="mb-2 font-medium">Billing Address</h4>
          <div className="flex items-start gap-2">
            <MapPin className="text-muted-foreground mt-0.5 h-4 w-4" />
            <div className="text-sm">
              <p>{payment.billingAddress.street}</p>
              <p>
                {payment.billingAddress.city}, {payment.billingAddress.state}{" "}
                {payment.billingAddress.zip}
              </p>
              <p>{payment.billingAddress.country}</p>
            </div>
          </div>
        </div>

        <div className="space-y-2 border-t pt-4">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Shipping</span>
            <span>${shipping.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Tax</span>
            <span>${tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between border-t pt-2 font-semibold">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
