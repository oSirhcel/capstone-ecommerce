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
import { MessageSquare, Plus, Eye } from "lucide-react";

interface CustomerInteractionsProps {
  customerId: string;
}

// Mock support tickets data
const supportTickets = [
  {
    id: "TICK-001",
    subject: "Issue with order delivery",
    status: "resolved",
    priority: "high",
    createdAt: "2024-01-08",
    updatedAt: "2024-01-10",
    assignedTo: "John Support",
    messages: 5,
  },
  {
    id: "TICK-002",
    subject: "Product quality question",
    status: "open",
    priority: "medium",
    createdAt: "2024-01-12",
    updatedAt: "2024-01-12",
    assignedTo: "Sarah Support",
    messages: 2,
  },
  {
    id: "TICK-003",
    subject: "Refund request",
    status: "closed",
    priority: "low",
    createdAt: "2023-12-20",
    updatedAt: "2023-12-22",
    assignedTo: "Mike Support",
    messages: 8,
  },
];

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

export function CustomerInteractions({
  customerId,
}: CustomerInteractionsProps) {
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
          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className="text-yellow-400">
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="text-muted-foreground text-sm">5.0</span>
                  </div>
                  <p className="font-medium">Excellent product quality!</p>
                  <p className="text-muted-foreground text-sm">
                    &quot;The ceramic mug I ordered is absolutely beautiful.
                    Great craftsmanship and fast shipping.&quot;
                  </p>
                  <p className="text-muted-foreground text-xs">
                    January 10, 2024 • Handcrafted Ceramic Mug
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[...Array(4)].map((_, i) => (
                        <span key={i} className="text-yellow-400">
                          ★
                        </span>
                      ))}
                      <span className="text-gray-300">★</span>
                    </div>
                    <span className="text-muted-foreground text-sm">4.0</span>
                  </div>
                  <p className="font-medium">Good value for money</p>
                  <p className="text-muted-foreground text-sm">
                    &quot;Nice product overall, delivery was a bit slow but
                    the quality makes up for it.&quot;
                  </p>
                  <p className="text-muted-foreground text-xs">
                    December 28, 2023 • Eco-Friendly Water Bottle
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
