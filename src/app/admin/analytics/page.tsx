"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Download,
  CalendarIcon,
  TrendingUp,
  TrendingDown,
  Filter,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";
import { fetchCategories as fetchCategoriesList } from "@/lib/api/categories";
import {
  useAnalyticsMetricsQuery,
  useAnalyticsRevenueQuery,
  useAnalyticsCategoriesQuery,
  useAnalyticsConversionQuery,
  useAnalyticsTrafficQuery,
  useAnalyticsCustomersQuery,
} from "@/hooks/admin/analytics/use-analytics";
import { RevenueChart } from "@/components/admin/analytics/revenue-chart";
import { CategoryPerformanceChart } from "@/components/admin/analytics/category-performance-chart";
import { ConversionFunnelChart } from "@/components/admin/analytics/conversion-funnel-chart";
import { TrafficSourcesChart } from "@/components/admin/analytics/traffic-sources-chart";
import { CustomerSegmentationChart } from "@/components/admin/analytics/customer-segmentation-chart";

export default function AnalyticsPage() {
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(2024, 0, 1),
    to: new Date(),
  });
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Prepare filter params
  const dateFrom = date?.from?.toISOString();
  const dateTo = date?.to?.toISOString();
  const categoryId = selectedCategory !== "all" ? selectedCategory : undefined;
  const currentYear = date?.to?.getFullYear() ?? new Date().getFullYear();

  // Fetch all analytics data
  const { data: metrics, isLoading: metricsLoading } = useAnalyticsMetricsQuery(
    dateFrom,
    dateTo,
    categoryId,
  );

  const { data: revenue, isLoading: revenueLoading } =
    useAnalyticsRevenueQuery(currentYear);

  const { data: categories, isLoading: categoriesLoading } =
    useAnalyticsCategoriesQuery(dateFrom, dateTo);

  const { data: conversion, isLoading: conversionLoading } =
    useAnalyticsConversionQuery(dateFrom, dateTo);

  const { data: traffic, isLoading: trafficLoading } = useAnalyticsTrafficQuery(
    dateFrom,
    dateTo,
  );

  const { data: categoriesList } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategoriesList,
  });

  const { data: customers, isLoading: customersLoading } =
    useAnalyticsCustomersQuery(dateFrom, dateTo);

  const handleExport = () => {
    // Export functionality
    console.log("Exporting analytics data...");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Analytics Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Comprehensive insights and performance metrics for your marketplace
          </p>
        </div>
        <Button onClick={handleExport} className="gap-2">
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
          <CardDescription>Customize your analytics view</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {/* Date Range Picker */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date?.from ? (
                      date.to ? (
                        <>
                          {format(date.from, "LLL dd, y")} -{" "}
                          {format(date.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(date.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={setDate}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categoriesList?.categories.map((category) => (
                    <SelectItem
                      key={category.id}
                      value={category.id.toString()}
                    >
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            {metricsLoading ? (
              <Skeleton className="h-4 w-4" />
            ) : metrics?.totalRevenue.trend === "up" ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <div className="flex flex-col gap-1">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  ${metrics?.totalRevenue.value ?? "0.00"}
                </div>
                <div className="text-muted-foreground flex items-center gap-1 text-xs">
                  <span
                    className={
                      metrics?.totalRevenue.trend === "up"
                        ? "text-green-500"
                        : "text-red-500"
                    }
                  >
                    {metrics?.totalRevenue.trend === "up" ? "+" : "-"}
                    {metrics?.totalRevenue.change ?? "0.0"}%
                  </span>
                  <span>vs last period</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Conversion Rate
            </CardTitle>
            {metricsLoading ? (
              <Skeleton className="h-4 w-4" />
            ) : metrics?.conversionRate.trend === "up" ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <div className="flex flex-col gap-1">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {metrics?.conversionRate.value ?? "0.00"}%
                </div>
                <div className="text-muted-foreground flex items-center gap-1 text-xs">
                  <span
                    className={
                      metrics?.conversionRate.trend === "up"
                        ? "text-green-500"
                        : "text-red-500"
                    }
                  >
                    {metrics?.conversionRate.trend === "up" ? "+" : "-"}
                    {metrics?.conversionRate.change ?? "0.0"}%
                  </span>
                  <span>vs last period</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Order Value
            </CardTitle>
            {metricsLoading ? (
              <Skeleton className="h-4 w-4" />
            ) : metrics?.avgOrderValue.trend === "up" ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <div className="flex flex-col gap-1">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  ${metrics?.avgOrderValue.value ?? "0.00"}
                </div>
                <div className="text-muted-foreground flex items-center gap-1 text-xs">
                  <span
                    className={
                      metrics?.avgOrderValue.trend === "up"
                        ? "text-green-500"
                        : "text-red-500"
                    }
                  >
                    {metrics?.avgOrderValue.trend === "up" ? "+" : "-"}
                    {metrics?.avgOrderValue.change ?? "0.0"}%
                  </span>
                  <span>vs last period</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Customer Lifetime Value
            </CardTitle>
            {metricsLoading ? (
              <Skeleton className="h-4 w-4" />
            ) : metrics?.customerLifetimeValue.trend === "up" ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <div className="flex flex-col gap-1">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  ${metrics?.customerLifetimeValue.value ?? "0.00"}
                </div>
                <div className="text-muted-foreground flex items-center gap-1 text-xs">
                  <span
                    className={
                      metrics?.customerLifetimeValue.trend === "up"
                        ? "text-green-500"
                        : "text-red-500"
                    }
                  >
                    {metrics?.customerLifetimeValue.trend === "up" ? "+" : "-"}
                    {metrics?.customerLifetimeValue.change ?? "0.0"}%
                  </span>
                  <span>vs last period</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Analytics Views */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="md:col-span-2">
              <RevenueChart data={revenue} isLoading={revenueLoading} />
            </div>
            <CategoryPerformanceChart
              data={categories}
              isLoading={categoriesLoading}
            />
            <TrafficSourcesChart data={traffic} isLoading={trafficLoading} />
          </div>
        </TabsContent>

        {/* Sales Tab */}
        <TabsContent value="sales" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="md:col-span-2">
              <RevenueChart data={revenue} isLoading={revenueLoading} />
            </div>
            <ConversionFunnelChart
              data={conversion}
              isLoading={conversionLoading}
            />
            <CategoryPerformanceChart
              data={categories}
              isLoading={categoriesLoading}
            />
          </div>
        </TabsContent>

        {/* Customers Tab */}
        <TabsContent value="customers" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <CustomerSegmentationChart
              data={customers}
              isLoading={customersLoading}
            />
            <TrafficSourcesChart data={traffic} isLoading={trafficLoading} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
