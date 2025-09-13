import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StoreIcon, HomeIcon } from "lucide-react";
import Link from "next/link";

export default function StoreManagementPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Store Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage store settings, inventory, and vendor relationships.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/" className="flex items-center">
            <HomeIcon className="mr-2 h-4 w-4" />
            Back to Store
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="text-center">
          <StoreIcon className="mx-auto h-16 w-16 text-gray-400" />
          <CardTitle className="text-xl">Store Management</CardTitle>
          <CardDescription>
            This page is under construction. Store management features will be
            available soon.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Features coming soon:
          </p>
          <ul className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            <li>• Store configuration</li>
            <li>• Vendor management</li>
            <li>• Inventory tracking</li>
            <li>• Store performance metrics</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
