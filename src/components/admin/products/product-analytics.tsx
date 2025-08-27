import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TrendingUp, Eye, ShoppingCart, DollarSign } from "lucide-react";

interface ProductAnalyticsProps {
  analytics: {
    views: number;
    sales: number;
    revenue: number;
    conversionRate: number;
  };
}

export function ProductAnalytics({ analytics }: ProductAnalyticsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Analytics</CardTitle>
        <CardDescription>Product performance metrics</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-2">
              <Eye className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Views</p>
              <p className="text-lg font-semibold">
                {analytics.views.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-100 p-2">
              <ShoppingCart className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Sales</p>
              <p className="text-lg font-semibold">{analytics.sales}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-yellow-100 p-2">
              <DollarSign className="h-4 w-4 text-yellow-600" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Revenue</p>
              <p className="text-lg font-semibold">
                ${analytics.revenue.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-100 p-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Conversion</p>
              <p className="text-lg font-semibold">
                {analytics.conversionRate}%
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
