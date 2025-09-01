import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Clock } from "lucide-react";

interface TimelineEvent {
  status: string;
  date: string;
  description: string;
}

interface OrderTimelineProps {
  timeline: TimelineEvent[];
}

export function OrderTimeline({ timeline }: OrderTimelineProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {timeline.map((event, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="mt-1 flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{event.status}</h4>
                  <span className="text-muted-foreground text-sm">
                    {event.date}
                  </span>
                </div>
                <p className="text-muted-foreground mt-1 text-sm">
                  {event.description}
                </p>
              </div>
            </div>
          ))}

          <div className="flex items-start gap-3 opacity-50">
            <div className="mt-1 flex-shrink-0">
              <Clock className="text-muted-foreground h-5 w-5" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium">Shipped</h4>
              <p className="text-muted-foreground mt-1 text-sm">
                Pending shipment
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
