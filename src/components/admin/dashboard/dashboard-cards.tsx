"use client";

import {
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  ShoppingCart,
  DollarSign,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSession } from "next-auth/react";
import { useDashboardMetricsQuery } from "@/hooks/admin/dashboard/use-dashboard-query";

const metricConfigs = [
  {
    title: "Total Revenue",
    key: "revenue" as const,
    icon: DollarSign,
    description: "from last month",
    formatValue: (value: string) => `$${value}`,
  },
  {
    title: "Active Users",
    key: "activeUsers" as const,
    icon: Users,
    description: "from last month",
    formatValue: (value: string) => value,
  },
  {
    title: "Total Products",
    key: "totalProducts" as const,
    icon: Package,
    description: "from last month",
    formatValue: (value: string) => value,
  },
  {
    title: "Total Orders",
    key: "totalOrders" as const,
    icon: ShoppingCart,
    description: "from last month",
    formatValue: (value: string) => value,
  },
];

export function DashboardCards() {
  const session = useSession();
  const storeId = session?.data?.store?.id;
  const { data: metrics, isLoading } = useDashboardMetricsQuery(storeId);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metricConfigs.map((config) => (
          <Card key={config.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {config.title}
              </CardTitle>
              <config.icon className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Loading...</div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metricConfigs.map((config) => (
          <Card key={config.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {config.title}
              </CardTitle>
              <config.icon className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">N/A</div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metricConfigs.map((config) => {
        const metric = metrics[config.key];
        const change = parseFloat(metric.change);
        const changeSign = change >= 0 ? "+" : "";

        return (
          <Card key={config.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {config.title}
              </CardTitle>
              <config.icon className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {config.formatValue(metric.value)}
              </div>
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
                  {changeSign}
                  {metric.change}%
                </span>
                <span className="ml-1">{config.description}</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
