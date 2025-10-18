import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  ShoppingCart,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSession } from "next-auth/react";
import { useOrderStats } from "@/hooks/admin/orders/use-order-stats";

export function OrdersStats() {
  const session = useSession();
  const storeId = session?.data?.store?.id ?? "";
  const { data } = useOrderStats({ storeId });

  const stats = [
    {
      title: "Total Orders",
      value: data ? String(data.totalOrders) : "-",
      change: `${data?.changes.totalOrders ?? 0}%`,
      trend: (data?.changes.totalOrders ?? 0) >= 0 ? "up" : "down",
      icon: ShoppingCart,
      description: "from previous period",
    },
    {
      title: "Revenue",
      value: data ? `$${data.revenue}` : "-",
      change: `${data?.changes.revenue ?? 0}%`,
      trend: (data?.changes.revenue ?? 0) >= 0 ? "up" : "down",
      icon: DollarSign,
      description: "from previous period",
    },
    {
      title: "Avg Order Value",
      value: data ? `$${data.averageOrderValue}` : "-",
      change: `${data?.changes.averageOrderValue ?? 0}%`,
      trend: (data?.changes.averageOrderValue ?? 0) >= 0 ? "up" : "down",
      icon: Package,
      description: "from previous period",
    },
    {
      title: "Active Customers",
      value: data ? String(data.activeCustomers) : "-",
      change: `${data?.changes.activeCustomers ?? 0}%`,
      trend: (data?.changes.activeCustomers ?? 0) >= 0 ? "up" : "down",
      icon: Users,
      description: "from previous period",
    },
  ] as const;

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
            <div className="text-muted-foreground flex items-center text-xs">
              {stat.trend === "up" ? (
                <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
              )}
              <span
                className={
                  stat.trend === "up" ? "text-green-500" : "text-red-500"
                }
              >
                {stat.change}
              </span>
              <span className="ml-1">{stat.description}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
