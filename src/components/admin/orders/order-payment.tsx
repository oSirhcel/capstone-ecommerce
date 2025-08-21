import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CreditCard, MapPin } from "lucide-react"

interface OrderPaymentProps {
  payment: {
    method: string
    last4: string
    brand: string
    status: string
  }
  billing: {
    address: {
      name: string
      street: string
      city: string
      state: string
      zip: string
      country: string
    }
  }
  totals: {
    subtotal: number
    tax: number
    shipping: number
    discount: number
    total: number
  }
}

export function OrderPayment({ payment, billing, totals }: OrderPaymentProps) {
  const paymentStatusColors = {
    paid: "bg-green-100 text-green-800",
    pending: "bg-yellow-100 text-yellow-800",
    failed: "bg-red-100 text-red-800",
    refunded: "bg-gray-100 text-gray-800",
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              {payment.brand} •••• {payment.last4}
            </span>
          </div>
          <Badge
            className={paymentStatusColors[payment.status as keyof typeof paymentStatusColors]}
            variant="secondary"
          >
            {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
          </Badge>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Billing Address</span>
          </div>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>{billing.address.name}</p>
            <p>{billing.address.street}</p>
            <p>
              {billing.address.city}, {billing.address.state} {billing.address.zip}
            </p>
            <p>{billing.address.country}</p>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>${totals.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Shipping</span>
            <span>${totals.shipping.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Tax</span>
            <span>${totals.tax.toFixed(2)}</span>
          </div>
          {totals.discount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount</span>
              <span>-${totals.discount.toFixed(2)}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between font-medium">
            <span>Total</span>
            <span>${totals.total.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
