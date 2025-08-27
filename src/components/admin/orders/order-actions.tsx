import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Mail, RefreshCw, Truck, AlertCircle } from "lucide-react";

interface OrderActionsProps {
  orderId: string;
}

export function OrderActions({ orderId }: OrderActionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium">
            Update Status
          </label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Button variant="outline" size="sm" className="w-full bg-transparent">
            <Mail className="mr-2 h-4 w-4" />
            Send Email Update
          </Button>

          <Button variant="outline" size="sm" className="w-full bg-transparent">
            <Truck className="mr-2 h-4 w-4" />
            Add Tracking Number
          </Button>

          <Button variant="outline" size="sm" className="w-full bg-transparent">
            <RefreshCw className="mr-2 h-4 w-4" />
            Process Refund
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="w-full bg-transparent text-red-600 hover:text-red-700"
          >
            <AlertCircle className="mr-2 h-4 w-4" />
            Cancel Order
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
