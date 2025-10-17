import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  Printer,
  Download,
  MoreVertical,
  Mail,
  Truck,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  Pencil,
} from "lucide-react";
import Link from "next/link";
import { formatOrderNumber } from "@/lib/utils/order-number";
import { format } from "date-fns";

interface OrderHeaderProps {
  order: {
    id: string;
    status: string;
    date: string;
  };
}

export function OrderHeader({ order }: OrderHeaderProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Completed":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            Completed
          </Badge>
        );
      case "Processing":
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            Processing
          </Badge>
        );
      case "Shipped":
        return (
          <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
            Shipped
          </Badge>
        );
      case "Pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            Pending
          </Badge>
        );
      case "Cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Link href="/admin/orders">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">
              {formatOrderNumber(order.id)}
            </h1>
            {getStatusBadge(order.status)}
          </div>

          <span className="text-muted-foreground text-xs">
            {format(new Date(order.date), "MMM d, yyyy hh:mm a")}
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm">
          <Pencil className="mr-2 h-4 w-4" /> Edit
        </Button>
        <Button variant="outline" size="sm">
          <Printer className="mr-2 h-4 w-4" />
          Print
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              More Actions <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            <DropdownMenuItem>
              <Download className="mr-2 h-4 w-4" />
              Export
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Mail className="mr-2 h-4 w-4" />
              Send Email Update
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Truck className="mr-2 h-4 w-4" />
              Add Tracking Number
            </DropdownMenuItem>
            <DropdownMenuItem>
              <RefreshCw className="mr-2 h-4 w-4" />
              Process Refund
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-600 focus:text-red-600">
              <AlertCircle className="mr-2 h-4 w-4" />
              Cancel Order
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
