import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Download } from "lucide-react";
import Link from "next/link";

interface OrderHeaderProps {
  order: {
    id: string;
    status: string;
    date: string;
    total: number;
  };
}

export function OrderHeader({ order }: OrderHeaderProps) {
  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "secondary";
      case "processing":
        return "default";
      case "shipped":
        return "default";
      case "delivered":
        return "default";
      case "cancelled":
        return "destructive";
      default:
        return "default";
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Link href="/admin/orders">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{order.id}</h1>
          <div className="mt-2 flex items-center gap-4">
            <Badge variant={getStatusVariant(order.status)}>
              {order.status}
            </Badge>
            <span className="text-muted-foreground">
              Placed on {new Date(order.date).toLocaleDateString()}
            </span>
            <span className="font-semibold">${order.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm">
          <Printer className="mr-2 h-4 w-4" />
          Print
        </Button>
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>
    </div>
  );
}
