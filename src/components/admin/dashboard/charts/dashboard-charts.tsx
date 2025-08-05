import {
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  ShoppingCart,
  DollarSign,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const metrics = [
  {
    title: "Total Revenue",
    value: "$45,231.89",
    change: "+20.1%",
    trend: "up",
    icon: DollarSign,
    description: "from last month",
  },
  {
    title: "Active Users",
    value: "2,350",
    change: "+180.1%",
    trend: "up",
    icon: Users,
    description: "from last month",
  },
  {
    title: "Total Products",
    value: "12,234",
    change: "+19%",
    trend: "up",
    icon: Package,
    description: "from last month",
  },
  {
    title: "Total Orders",
    value: "573",
    change: "-4.3%",
    trend: "down",
    icon: ShoppingCart,
    description: "from last month",
  },
];

export function DashboardCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => (
        <Card key={metric.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {metric.title}
            </CardTitle>
            <metric.icon className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metric.value}</div>
            <div className="text-muted-foreground flex items-center text-xs">
              {metric.trend === "up" ? (
                <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
              )}
              <span
                className={
                  metric.trend === "up" ? "text-green-500" : "text-red-500"
                }
              >
                {metric.change}
              </span>
              <span className="ml-1">{metric.description}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
