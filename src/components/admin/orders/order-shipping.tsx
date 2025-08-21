import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Truck } from "lucide-react"

interface OrderShippingProps {
  shipping: {
    method: string
    cost: number
    estimatedDelivery: string
    address: {
      name: string
      street: string
      city: string
      state: string
      zip: string
      country: string
    }
  }
}

export function OrderShipping({ shipping }: OrderShippingProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Shipping</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{shipping.method}</span>
          </div>
          <Badge variant="outline">${shipping.cost.toFixed(2)}</Badge>
        </div>

        <div>
          <p className="text-sm text-muted-foreground mb-1">Estimated Delivery</p>
          <p className="font-medium">{new Date(shipping.estimatedDelivery).toLocaleDateString()}</p>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Shipping Address</span>
          </div>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>{shipping.address.name}</p>
            <p>{shipping.address.street}</p>
            <p>
              {shipping.address.city}, {shipping.address.state} {shipping.address.zip}
            </p>
            <p>{shipping.address.country}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
