import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Circle, Clock } from "lucide-react"

interface TimelineEvent {
  id: string
  status: string
  title: string
  description: string
  timestamp: string
  user: string
}

interface OrderTimelineProps {
  timeline: TimelineEvent[]
}

export function OrderTimeline({ timeline }: OrderTimelineProps) {
  const getStatusIcon = (status: string, index: number) => {
    const isCompleted = index < timeline.length - 1
    const isCurrent = index === timeline.length - 1

    if (isCompleted) {
      return <CheckCircle className="h-5 w-5 text-green-500" />
    } else if (isCurrent) {
      return <Clock className="h-5 w-5 text-blue-500" />
    } else {
      return <Circle className="h-5 w-5 text-gray-300" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {timeline.map((event, index) => (
            <div key={event.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                {getStatusIcon(event.status, index)}
                {index < timeline.length - 1 && <div className="w-px h-8 bg-gray-200 mt-2" />}
              </div>
              <div className="flex-1 pb-4">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-medium">{event.title}</h4>
                  <span className="text-xs text-muted-foreground">{new Date(event.timestamp).toLocaleString()}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
                <Badge variant="outline" className="text-xs">
                  {event.user}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
