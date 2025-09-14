import { DashboardCards } from "@/components/admin/dashboard/charts/dashboard-charts";
import { SalesChart } from "@/components/admin/dashboard/charts/sales-chart";
import { UserGrowthChart } from "@/components/admin/dashboard/charts/user-growth-chart";
import { TopProductsChart } from "@/components/admin/dashboard/charts/top-products-chart";
import { RecentActivity } from "@/components/admin/dashboard/recent-activity";
import { RecentOrders } from "@/components/admin/dashboard/recent-orders";
import { Button } from "@/components/ui/button";
import { HomeIcon } from "lucide-react";
import Link from "next/link";

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard Overview
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Welcome back! Here&apos;s what&apos;s happening with your
            marketplace.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/" className="flex items-center">
            <HomeIcon className="mr-2 h-4 w-4" />
            Back to Store
          </Link>
        </Button>
      </div>

      {/* Key Metrics */}
      <DashboardCards />

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="md:col-span-2">
          <SalesChart />
        </div>
        <UserGrowthChart />
        <TopProductsChart />
      </div>

      {/* Recent Activity and Orders */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RecentActivity />
        <RecentOrders />
      </div>
    </div>
  );
}
