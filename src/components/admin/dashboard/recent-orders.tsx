import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

const orders = [
  {
    id: "#001",
    customer: "John Doe",
    amount: "$89.99",
    status: "completed",
    date: "2024-01-15",
  },
  {
    id: "#002",
    customer: "Sarah Johnson",
    amount: "$156.50",
    status: "processing",
    date: "2024-01-15",
  },
  {
    id: "#003",
    customer: "Mike Chen",
    amount: "$45.00",
    status: "shipped",
    date: "2024-01-14",
  },
  {
    id: "#004",
    customer: "Emily Rodriguez",
    amount: "$234.99",
    status: "pending",
    date: "2024-01-14",
  },
  {
    id: "#005",
    customer: "David Wilson",
    amount: "$67.50",
    status: "completed",
    date: "2024-01-13",
  },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case "completed":
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          Completed
        </Badge>
      );
    case "processing":
      return (
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
          Processing
        </Badge>
      );
    case "shipped":
      return (
        <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
          Shipped
        </Badge>
      );
    case "pending":
      return (
        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
          Pending
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

export function RecentOrders() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Orders</CardTitle>
        <CardDescription>Latest orders from your marketplace</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{order.id}</p>
                  {getStatusBadge(order.status)}
                </div>
                <p className="text-muted-foreground text-sm">
                  {order.customer} • {order.date}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{order.amount}</span>
                <Button variant="ghost" size="icon">
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
