import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const activities = [
  {
    id: 1,
    user: "John Doe",
    avatar: "/placeholder.svg?height=32&width=32",
    action: "created a new product",
    target: "Handcrafted Ceramic Mug",
    time: "2 minutes ago",
    type: "product",
  },
  {
    id: 2,
    user: "Sarah Johnson",
    avatar: "/placeholder.svg?height=32&width=32",
    action: "placed an order",
    target: "#001",
    time: "5 minutes ago",
    type: "order",
  },
  {
    id: 3,
    user: "Mike Chen",
    avatar: "/placeholder.svg?height=32&width=32",
    action: "registered as a new seller",
    target: "Digital Designs Store",
    time: "10 minutes ago",
    type: "user",
  },
  {
    id: 4,
    user: "Emily Rodriguez",
    avatar: "/placeholder.svg?height=32&width=32",
    action: "updated product inventory",
    target: "Organic Skincare Set",
    time: "15 minutes ago",
    type: "product",
  },
  {
    id: 5,
    user: "David Wilson",
    avatar: "/placeholder.svg?height=32&width=32",
    action: "completed payment",
    target: "$89.99",
    time: "20 minutes ago",
    type: "payment",
  },
];

const getActivityBadge = (type: string) => {
  switch (type) {
    case "product":
      return <Badge variant="secondary">Product</Badge>;
    case "order":
      return <Badge variant="default">Order</Badge>;
    case "user":
      return <Badge variant="outline">User</Badge>;
    case "payment":
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          Payment
        </Badge>
      );
    default:
      return <Badge variant="secondary">Activity</Badge>;
  }
};

export function RecentActivity() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>
          Latest actions across your marketplace
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={activity.avatar || "/placeholder.svg"}
                  alt={activity.user}
                />
                <AvatarFallback>{activity.user.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm">
                    <span className="font-medium">{activity.user}</span>{" "}
                    {activity.action}{" "}
                    <span className="font-medium">{activity.target}</span>
                  </p>
                  {getActivityBadge(activity.type)}
                </div>
                <p className="text-muted-foreground text-xs">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
