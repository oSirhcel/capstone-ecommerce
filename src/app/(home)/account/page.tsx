"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Package, MapPin, Clock, CheckCircle } from "lucide-react";

export default function AccountOverviewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Account Overview</h1>
        <p className="text-muted-foreground">
          Welcome back! Here&apos;s what&apos;s happening with your account.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Orders</CardTitle>
            <Package className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-muted-foreground text-xs">
              2 delivered, 1 in transit
            </p>
            <Link href="/account/orders">
              <Button
                variant="outline"
                size="sm"
                className="mt-3 bg-transparent"
              >
                View All Orders
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Saved Addresses
            </CardTitle>
            <MapPin className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-muted-foreground text-xs">1 default address</p>
            <Link href="/account/addresses">
              <Button
                variant="outline"
                size="sm"
                className="mt-3 bg-transparent"
              >
                Manage Addresses
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Account Status
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Active</div>
            <p className="text-muted-foreground text-xs">
              Member since Jan 2024
            </p>
            <Link href="/account/settings">
              <Button
                variant="outline"
                size="sm"
                className="mt-3 bg-transparent"
              >
                Account Settings
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Order #12345 delivered</p>
                  <p className="text-muted-foreground text-xs">
                    Electronics from TechStore
                  </p>
                </div>
              </div>
              <Badge variant="secondary">2 days ago</Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                  <Clock className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Order #12344 in transit</p>
                  <p className="text-muted-foreground text-xs">
                    Clothing from FashionHub
                  </p>
                </div>
              </div>
              <Badge variant="outline">1 week ago</Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
                  <MapPin className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">New address added</p>
                  <p className="text-muted-foreground text-xs">Brooklyn, NY</p>
                </div>
              </div>
              <Badge variant="outline">2 weeks ago</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
