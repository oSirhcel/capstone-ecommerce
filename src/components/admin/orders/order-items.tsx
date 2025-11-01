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
  return (
    <Card>
      <CardHeader>
        <CardTitle>Products</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-lg border p-3"
            >
              <Image
                src={item.image || "/placeholder.svg"}
                alt={item.name}
                width={48}
                height={48}
                className="aspect-square rounded-md object-contain"
              />
              <div className="min-w-0 flex-1">
                <h4 className="truncate text-sm font-medium">{item.name}</h4>
                <p className="text-muted-foreground text-xs">
                  ${item.price.toFixed(2)} × {item.quantity}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">
                  ${item.total.toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
