"use client";

import OverviewCards from "@/components/account/overview-cards";
import RecentActivity from "@/components/account/recent-activity";

export default function AccountOverviewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Account Overview</h1>
        <p className="text-muted-foreground">
          Welcome back! Here&apos;s what&apos;s happening with your account.
        </p>
      </div>

      <OverviewCards />

      <RecentActivity />
    </div>
  );
}
