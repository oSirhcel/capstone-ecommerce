import { DashboardCards } from "@/components/admin/dashboard/charts/dashboard-charts";
import { SalesChart } from "@/components/admin/dashboard/charts/sales-chart";
import { RecentActivity } from "@/components/admin/dashboard/recent-activity";
import { RecentOrders } from "@/components/admin/dashboard/recent-orders";
import { OnboardingTracker } from "@/components/onboarding/onboarding-tracker";
import { Button } from "@/components/ui/button";
import { HomeIcon, StoreIcon } from "lucide-react";
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
            Welcome back! Here&apos;s what&apos;s happening with your store.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/" className="flex items-center">
            <StoreIcon className="mr-2 h-4 w-4" />
            Marketplace
          </Link>
        </Button>
      </div>

      {/* Onboarding Tracker */}
      <OnboardingTracker />

      {/* Key Metrics */}
      <DashboardCards />

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="md:col-span-2">
          <SalesChart />
        </div>
      </div>

      {/* Recent Activity and Orders */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RecentActivity />
        <RecentOrders />
      </div>
    </div>
  );
}
