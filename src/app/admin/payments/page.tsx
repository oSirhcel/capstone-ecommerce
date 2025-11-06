import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreditCardIcon } from "lucide-react";

export default function PaymentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Payments Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage payment methods, transactions, and financial reports.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="text-center">
          <CreditCardIcon className="mx-auto h-16 w-16 text-gray-400" />
          <CardTitle className="text-xl">Payments Dashboard</CardTitle>
          <CardDescription>
            This page is under construction. Payment management features will be
            available soon.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Features coming soon:
          </p>
          <ul className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            <li>• Transaction history</li>
            <li>• Payment method management</li>
            <li>• Refund processing</li>
            <li>• Financial reports</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
