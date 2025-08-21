import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RefreshCw, Send, AlertTriangle } from "lucide-react"

interface OrderActionsProps {
  order: {
    id: string
    status: string
  }
}

export function OrderActions({ order }: OrderActionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Update Status</label>
          <Select defaultValue={order.status}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button className="w-full">
          <RefreshCw className="h-4 w-4 mr-2" />
          Update Status
        </Button>

        <div className="space-y-2">
          <Button variant="outline" size="sm" className="w-full bg-transparent">
            <Send className="h-4 w-4 mr-2" />
            Send Update Email
          </Button>

          <Button variant="outline" size="sm" className="w-full bg-transparent">
            Add Tracking Number
          </Button>

          <Button variant="outline" size="sm" className="w-full text-red-600 hover:text-red-700 bg-transparent">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Issue Refund
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
