import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"

interface OrderItem {
  id: string
  name: string
  image: string
  price: number
  quantity: number
  total: number
  sku: string
}

interface OrderItemsProps {
  items: OrderItem[]
}

export function OrderItems({ items }: OrderItemsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Items ({items.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
              <Image
                src={item.image || "/placeholder.svg"}
                alt={item.name}
                width={80}
                height={80}
                className="rounded-md object-cover"
              />
              <div className="flex-1">
                <h4 className="font-medium">{item.name}</h4>
                <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline">${item.price.toFixed(2)}</Badge>
                  <span className="text-sm text-muted-foreground">×</span>
                  <Badge variant="outline">Qty: {item.quantity}</Badge>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium">${item.total.toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
