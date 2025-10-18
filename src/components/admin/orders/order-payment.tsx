import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Payment {
  method: string;
  last4: string;
}

interface OrderPaymentProps {
  payment: Payment;
  total: number;
}

export function OrderPayment({ payment: _payment, total }: OrderPaymentProps) {
  //TODO: Proper Payment implementation
  const subtotal = total - 10.0; // Assuming $10 shipping
  const tax = subtotal * 0.1; // 10% tax
  const shipping = 10.0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
