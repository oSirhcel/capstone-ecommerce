import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ShoppingCart, Calendar, TrendingUp } from "lucide-react";

interface CustomerStatsProps {
  customer: {
    totalSpent: number;
    totalOrders: number;
    averageOrderValue: number;
    lastOrder: string;
  };
}

export function CustomerStats({ customer }: CustomerStatsProps) {
  const stats = [
    {
      title: "Total Spent",
      value: `$${customer.totalSpent.toFixed(2)}`,
      icon: DollarSign,
      description: "Lifetime value",
    },
    {
      title: "Total Orders",
      value: customer.totalOrders.toString(),
      icon: ShoppingCart,
      description: "All time",
    },
    {
      title: "Average Order",
      value: `$${customer.averageOrderValue.toFixed(2)}`,
      icon: TrendingUp,
      description: "Per order",
    },
    {
      title: "Last Order",
      value: new Date(customer.lastOrder).toLocaleDateString(),
      icon: Calendar,
      description: "Most recent",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-muted-foreground text-xs">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
