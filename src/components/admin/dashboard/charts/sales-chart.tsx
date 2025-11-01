"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useSession } from "next-auth/react";
import { useSalesDataQuery } from "@/hooks/admin/dashboard/use-dashboard-query";

const chartConfig = {
  sales: {
    label: "Sales",
    color: "var(--color-chart-1)",
  },
  orders: {
    label: "Orders",
    color: "var(--color-chart-5)",
  },
} satisfies ChartConfig;

export function SalesChart() {
  const session = useSession();
  const storeId = session?.data?.store?.id;
  const { data: salesData, isLoading } = useSalesDataQuery(storeId);

  const chartData =
    salesData?.map((item) => ({
      name: item.name,
      sales: item.sales,
      orders: item.orders,
    })) ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales Overview</CardTitle>
        <CardDescription>Monthly sales and order trends</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-[300px] items-center justify-center">
            <div className="text-muted-foreground">Loading chart data...</div>
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex h-[300px] items-center justify-center">
            <div className="text-muted-foreground">No data available</div>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <BarChart data={chartData} accessibilityLayer>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="name"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
              />
              <YAxis
                yAxisId="sales"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
              />
              <YAxis
                yAxisId="orders"
                orientation="right"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                yAxisId="sales"
                dataKey="sales"
                fill="var(--color-sales)"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                yAxisId="orders"
                dataKey="orders"
                fill="var(--color-orders)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
