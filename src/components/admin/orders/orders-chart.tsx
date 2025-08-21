"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const data = [
  { name: "Jan", orders: 65, revenue: 4000 },
  { name: "Feb", orders: 59, revenue: 3000 },
  { name: "Mar", orders: 80, revenue: 5000 },
  { name: "Apr", orders: 81, revenue: 4500 },
  { name: "May", orders: 56, revenue: 3500 },
  { name: "Jun", orders: 89, revenue: 6000 },
  { name: "Jul", orders: 95, revenue: 6500 },
]

export function OrdersChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Orders Trend</CardTitle>
        <CardDescription>Monthly orders and revenue overview</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="orders" stroke="hsl(var(--primary))" strokeWidth={2} name="Orders" />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--destructive))"
                strokeWidth={2}
                name="Revenue ($)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
