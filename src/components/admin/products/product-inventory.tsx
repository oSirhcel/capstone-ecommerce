import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ProductInventoryProps {
  inventory: {
    trackQuantity: boolean;
    quantity: number;
    allowBackorders: boolean;
    weight?: number;
    dimensions?: {
      length?: number;
      width?: number;
      height?: number;
    };
  };
}

export function ProductInventory({ inventory }: ProductInventoryProps) {
  const getStockStatus = (quantity: number) => {
    if (quantity === 0)
      return { label: "Out of Stock", variant: "destructive" as const };
    if (quantity <= 10)
      return { label: "Low Stock", variant: "secondary" as const };
    return { label: "In Stock", variant: "default" as const };
  };

  const stockStatus = getStockStatus(inventory.quantity);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Inventory Tracking</CardTitle>
          <CardDescription>Stock levels and inventory settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-muted-foreground mb-1 text-sm font-medium">
                Track Quantity
              </h3>
              <p className="text-sm">
                {inventory.trackQuantity ? "Enabled" : "Disabled"}
              </p>
            </div>
            <div>
              <h3 className="text-muted-foreground mb-1 text-sm font-medium">
                Allow Backorders
              </h3>
              <p className="text-sm">
                {inventory.allowBackorders ? "Yes" : "No"}
              </p>
            </div>
          </div>

          {inventory.trackQuantity && (
            <div>
              <h3 className="text-muted-foreground mb-2 text-sm font-medium">
                Current Stock
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{inventory.quantity}</span>
                <Badge variant={stockStatus.variant}>{stockStatus.label}</Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Shipping Information</CardTitle>
          <CardDescription>
            Physical properties for shipping calculations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {inventory.weight && (
              <div>
                <h3 className="text-muted-foreground mb-1 text-sm font-medium">
                  Weight
                </h3>
                <p className="text-sm">{inventory.weight} kg</p>
              </div>
            )}
            {inventory.dimensions?.length && (
              <div>
                <h3 className="text-muted-foreground mb-1 text-sm font-medium">
                  Length
                </h3>
                <p className="text-sm">{inventory.dimensions.length} cm</p>
              </div>
            )}
            {inventory.dimensions?.width && (
              <div>
                <h3 className="text-muted-foreground mb-1 text-sm font-medium">
                  Width
                </h3>
                <p className="text-sm">{inventory.dimensions.width} cm</p>
              </div>
            )}
            {inventory.dimensions?.height && (
              <div>
                <h3 className="text-muted-foreground mb-1 text-sm font-medium">
                  Height
                </h3>
                <p className="text-sm">{inventory.dimensions.height} cm</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
