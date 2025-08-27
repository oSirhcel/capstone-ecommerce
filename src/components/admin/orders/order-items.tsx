import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";

interface OrderItem {
  id: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  total: number;
  store: string;
}

interface OrderItemsProps {
  items: OrderItem[];
}

export function OrderItems({ items }: OrderItemsProps) {
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Items</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 rounded-lg border p-4"
            >
              <Image
                src={item.image || "/placeholder.svg"}
                alt={item.name}
                width={60}
                height={60}
                className="rounded-md object-cover"
              />
              <div className="flex-1">
                <h4 className="font-medium">{item.name}</h4>
                <p className="text-muted-foreground text-sm">
                  Store: {item.store}
                </p>
                <p className="text-muted-foreground text-sm">
                  ${item.price.toFixed(2)} × {item.quantity}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold">${item.total.toFixed(2)}</p>
              </div>
            </div>
          ))}

          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Subtotal</span>
              <span className="font-semibold">${subtotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
