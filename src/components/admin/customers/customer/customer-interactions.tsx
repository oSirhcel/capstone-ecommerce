import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, Plus, Eye, Star } from "lucide-react";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";

// Mock support tickets data - empty for now to show empty state
const supportTickets: {
  id: string;
  subject: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  assignedTo: string;
  messages: number;
}[] = [];

const getStatusBadge = (status: string) => {
  switch (status) {
    case "open":
      return (
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
          Open
        </Badge>
      );
    case "resolved":
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          Resolved
        </Badge>
      );
    case "closed":
      return <Badge variant="secondary">Closed</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

const getPriorityBadge = (priority: string) => {
  switch (priority) {
    case "high":
      return <Badge variant="destructive">High</Badge>;
    case "medium":
      return (
        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
          Medium
        </Badge>
      );
    case "low":
      return <Badge variant="outline">Low</Badge>;
    default:
      return <Badge variant="outline">{priority}</Badge>;
  }
};

export function CustomerInteractions() {
  return (
    <div className="space-y-6">
      {/* Support Tickets */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Support Tickets
              </CardTitle>
              <CardDescription>
                Customer support interactions and tickets
              </CardDescription>
            </div>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              New Ticket
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {supportTickets.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <MessageSquare />
                </EmptyMedia>
                <EmptyTitle>No support tickets</EmptyTitle>
                <EmptyDescription>
                  No support tickets have been created for this customer yet.
                  Create a ticket to track customer support issues.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Ticket
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            <div className="space-y-4">
              {supportTickets.map((ticket) => (
                <Card key={ticket.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{ticket.subject}</h4>
                          {getStatusBadge(ticket.status)}
                          {getPriorityBadge(ticket.priority)}
                        </div>
                        <div className="text-muted-foreground flex items-center gap-4 text-sm">
                          <span>#{ticket.id}</span>
                          <span>•</span>
                          <span>
                            Created{" "}
                            {new Date(ticket.createdAt).toLocaleDateString()}
                          </span>
                          <span>•</span>
                          <span>{ticket.messages} messages</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {ticket.assignedTo.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-muted-foreground">
                            Assigned to {ticket.assignedTo}
                          </span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Eye className="mr-1 h-3 w-3" />
                        View
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Customer Feedback */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Feedback</CardTitle>
          <CardDescription>
            Reviews and feedback from this customer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Star />
              </EmptyMedia>
              <EmptyTitle>No feedback yet</EmptyTitle>
              <EmptyDescription>
                This customer hasn&apos;t left any reviews or feedback yet.
                Feedback will appear here when submitted.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    </div>
  );
}
