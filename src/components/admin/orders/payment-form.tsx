"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CreditCard, Banknote, Building } from "lucide-react"
import type { PaymentData } from "@/app/admin/orders/create/page"

interface PaymentFormProps {
  paymentData: PaymentData
  onPaymentDataChange: (data: PaymentData) => void
  orderNotes: string
  onOrderNotesChange: (notes: string) => void
}

export function PaymentForm({ paymentData, onPaymentDataChange, orderNotes, onOrderNotesChange }: PaymentFormProps) {
  const handlePaymentChange = (field: keyof PaymentData, value: any) => {
    onPaymentDataChange({
      ...paymentData,
      [field]: value,
    })
  }

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case "card":
        return <CreditCard className="h-4 w-4" />
      case "cash":
        return <Banknote className="h-4 w-4" />
      case "bank_transfer":
        return <Building className="h-4 w-4" />
      default:
        return <CreditCard className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Payment Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Information
          </CardTitle>
          <CardDescription>Configure payment method and status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select
                value={paymentData.method}
                onValueChange={(value) => handlePaymentChange("method", value as PaymentData["method"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="card">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Credit/Debit Card
                    </div>
                  </SelectItem>
                  <SelectItem value="cash">
                    <div className="flex items-center gap-2">
                      <Banknote className="h-4 w-4" />
                      Cash
                    </div>
                  </SelectItem>
                  <SelectItem value="bank_transfer">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Bank Transfer
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="paymentStatus">Payment Status</Label>
              <Select
                value={paymentData.status}
                onValueChange={(value) => handlePaymentChange("status", value as PaymentData["status"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="paymentNotes">Payment Notes (Optional)</Label>
            <Textarea
              id="paymentNotes"
              placeholder="Add any payment-related notes..."
              value={paymentData.notes || ""}
              onChange={(e) => handlePaymentChange("notes", e.target.value)}
              className="min-h-[80px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Order Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Order Notes</CardTitle>
          <CardDescription>Add any additional notes for this order</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Add order notes, special instructions, or internal comments..."
            value={orderNotes}
            onChange={(e) => onOrderNotesChange(e.target.value)}
            className="min-h-[120px]"
          />
        </CardContent>
      </Card>
    </div>
  )
}
