"use client";

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
  Mail,
  Truck,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  Pencil,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const isEditable = !["Shipped", "Completed"].includes(order.status);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Completed":
        return (
          <Badge className="bg-green-100 text-base text-green-800 hover:bg-green-100">
            Completed
          </Badge>
        );
      case "Processing":
        return (
          <Badge className="bg-blue-100 text-base text-blue-800 hover:bg-blue-100">
            Processing
          </Badge>
        );
      case "Shipped":
        return (
          <Badge className="bg-purple-100 text-base text-purple-800 hover:bg-purple-100">
            Shipped
          </Badge>
        );
      case "Pending":
        return (
          <Badge className="bg-yellow-100 text-base text-yellow-800 hover:bg-yellow-100">
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
    <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0 flex-1">
        <div className="space-y-1">
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Link
              href={`/admin/orders`}
              className="hover:text-foreground flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to orders
            </Link>
          </div>
          <div className="min-w-0">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold lg:text-3xl">
                Order {formatOrderNumber(order.id)}
              </h1>
              {getStatusBadge(order.status)}
            </div>

            <span className="text-muted-foreground text-xs">
              {format(new Date(order.date), "MMM d, yyyy hh:mm a")}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-shrink-0 flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!isEditable}
          onClick={() => router.push(`/admin/orders/${order.id}/edit`)}
        >
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
