import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PaymentMethod {
  type: string;
  provider: string;
  lastFourDigits?: string;
  expiryMonth?: number;
  expiryYear?: number;
}

interface Payment {
  status: string;
  amount?: number; // cents
  currency?: string;
  transactionId?: string;
  createdAt?: string;
  paymentMethod?: PaymentMethod | null;
}

interface OrderPaymentProps {
  payment: Payment;
  total: number; // dollars
  subtotal?: number; // cents
  tax?: number; // cents
  shipping?: number; // cents
}

function formatPaymentMethod(
  paymentMethod: PaymentMethod | null | undefined,
): string {
  if (!paymentMethod) return "N/A";

  const provider = paymentMethod.provider || paymentMethod.type;
  const last4 = paymentMethod.lastFourDigits;

  if (last4) {
    return `${provider} •••• ${last4}`;
  }

  return provider;
}

function getPaymentStatusBadge(status: string) {
  const statusLower = status.toLowerCase();
  if (statusLower === "completed" || statusLower === "paid") {
    return (
      <Badge variant="default" className="bg-green-500">
        Paid
      </Badge>
    );
  }
  if (statusLower === "pending") {
    return <Badge variant="secondary">Pending</Badge>;
  }
  if (statusLower === "failed" || statusLower === "denied") {
    return <Badge variant="destructive">Failed</Badge>;
  }
  return <Badge variant="outline">{status}</Badge>;
}

export function OrderPayment({
  payment,
  total,
  subtotal,
  tax,
  shipping,
}: OrderPaymentProps) {
  // Convert cents to dollars, or calculate from total if not provided
  const subtotalDollars = subtotal !== undefined ? subtotal / 100 : total * 0.9;
  const taxDollars = tax !== undefined ? tax / 100 : subtotalDollars * 0.1;
  const shippingDollars = shipping !== undefined ? shipping / 100 : 0;

  // Ensure total matches the sum (handle rounding)
  const calculatedTotal = subtotalDollars + taxDollars + shippingDollars;
  const displayTotal =
    Math.abs(calculatedTotal - total) < 0.01 ? total : calculatedTotal;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Payment</span>
          {getPaymentStatusBadge(payment.status)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {payment.paymentMethod && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Payment Method</div>
            <div className="text-muted-foreground text-sm">
              {formatPaymentMethod(payment.paymentMethod)}
            </div>
            {payment.transactionId && (
              <div className="text-muted-foreground text-xs">
                Transaction: {payment.transactionId.slice(0, 20)}...
              </div>
            )}
          </div>
        )}
        <div className="space-y-2 border-t pt-4">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>${subtotalDollars.toFixed(2)}</span>
          </div>
          {shippingDollars > 0 && (
            <div className="flex justify-between text-sm">
              <span>Shipping</span>
              <span>${shippingDollars.toFixed(2)}</span>
            </div>
          )}
          {taxDollars > 0 && (
            <div className="flex justify-between text-sm">
              <span>Tax</span>
              <span>${taxDollars.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between border-t pt-2 font-semibold">
            <span>Total</span>
            <span>${displayTotal.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
