"use client";

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
import { useCustomerDetail } from "@/contexts/customer-detail-context";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";

// Mock timeline data - empty for now to show empty state
const timelineEvents: {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  icon: typeof ShoppingCart;
}[] = [];

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

export function CustomerTimeline() {
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
        {timelineEvents.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Clock />
              </EmptyMedia>
              <EmptyTitle>No activity yet</EmptyTitle>
              <EmptyDescription>
                No timeline events to display. Customer activity will appear
                here as they interact with your store.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
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
        )}
      </CardContent>
    </Card>
  );
}
