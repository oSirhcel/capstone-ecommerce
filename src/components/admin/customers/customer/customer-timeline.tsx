import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Clock,
  ShoppingCart,
  MessageSquare,
  User,
  CreditCard,
} from "lucide-react";

interface CustomerTimelineProps {
  customerId: string;
}

// Mock timeline data
const timelineEvents = [
  {
    id: "1",
    type: "order",
    title: "Placed order #ORD-1234",
    description: "3 items • $89.99",
    timestamp: "2024-01-10T10:30:00Z",
    icon: ShoppingCart,
  },
  {
    id: "2",
    type: "support",
    title: "Created support ticket",
    description: "Issue with order delivery",
    timestamp: "2024-01-08T14:15:00Z",
    icon: MessageSquare,
  },
  {
    id: "3",
    type: "order",
    title: "Placed order #ORD-1235",
    description: "2 items • $156.50",
    timestamp: "2024-01-05T09:20:00Z",
    icon: ShoppingCart,
  },
  {
    id: "4",
    type: "payment",
    title: "Added payment method",
    description: "Visa ending in 4242",
    timestamp: "2024-01-01T16:45:00Z",
    icon: CreditCard,
  },
  {
    id: "5",
    type: "account",
    title: "Account created",
    description: "Joined as customer",
    timestamp: "2023-03-15T12:00:00Z",
    icon: User,
  },
];

const getEventColor = (type: string) => {
  switch (type) {
    case "order":
      return "bg-blue-500";
    case "support":
      return "bg-yellow-500";
    case "payment":
      return "bg-green-500";
    case "account":
      return "bg-purple-500";
    default:
      return "bg-gray-500";
  }
};

export function CustomerTimeline({ customerId }: CustomerTimelineProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Timeline
        </CardTitle>
        <CardDescription>
          Recent customer activity and interactions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {timelineEvents.map((event, index) => (
            <div key={event.id} className="flex gap-3">
              <div className="relative">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${getEventColor(event.type)}`}
                >
                  <event.icon className="h-4 w-4 text-white" />
                </div>
                {index < timelineEvents.length - 1 && (
                  <div className="bg-border absolute top-8 left-4 h-6 w-px"></div>
                )}
              </div>
              <div className="flex-1 space-y-1">
                <p className="font-medium">{event.title}</p>
                <p className="text-muted-foreground text-sm">
                  {event.description}
                </p>
                <p className="text-muted-foreground text-xs">
                  {new Date(event.timestamp).toLocaleDateString()} at{" "}
                  {new Date(event.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
