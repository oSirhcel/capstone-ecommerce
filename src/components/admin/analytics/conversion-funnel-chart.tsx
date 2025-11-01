"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from "recharts";
import type { ConversionStage } from "@/lib/api/admin/analytics";

interface ConversionFunnelChartProps {
  data?: ConversionStage[];
  isLoading?: boolean;
}

export function ConversionFunnelChart({
  data,
  isLoading,
}: ConversionFunnelChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Conversion Funnel</CardTitle>
          <CardDescription>
            Customer journey from visit to purchase
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Conversion Funnel</CardTitle>
          <CardDescription>
            Customer journey from visit to purchase
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground flex h-[200px] items-center justify-center">
            No conversion data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const colors = [
    "var(--chart-1)",
    "var(--chart-2)",
    "var(--chart-3)",
    "var(--chart-4)",
    "var(--chart-5)",
  ];

  const chartConfig = data.reduce((acc, item, index) => {
    const colorKey = item.stage.replace(/\s+/g, "-").toLowerCase();
    acc[colorKey] = {
      label: item.stage,
      color: colors[index % colors.length],
    };
    return acc;
  }, {} as ChartConfig);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversion Funnel</CardTitle>
        <CardDescription>
          Customer journey from visit to purchase
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <BarChart data={data} layout="vertical" accessibilityLayer>
            <CartesianGrid horizontal={false} />
            <XAxis type="number" tickLine={false} axisLine={false} />
            <YAxis
              dataKey="stage"
              type="category"
              width={100}
              tickLine={false}
              axisLine={false}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, _name, _item, _index, _payload) => {
                    const stage = data.find((d) => d.count === value);
                    return [
                      `${Number(value).toLocaleString()} (${stage?.percentage ?? 0}%)`,
                      "Count",
                    ];
                  }}
                />
              }
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => {
                const colorKey = entry.stage.replace(/\s+/g, "-").toLowerCase();
                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={`var(--color-${colorKey})`}
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
