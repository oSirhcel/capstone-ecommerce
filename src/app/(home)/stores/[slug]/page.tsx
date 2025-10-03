import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { CreditCardIcon, HomeIcon, SearchIcon } from "lucide-react";

export default function StoreDetailsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Link href="/stores" className="hover:text-primary">
              Stores
            </Link>
            <span>/</span>
            <span>Store Details</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Store Details
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View store details, products, and orders.
          </p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CreditCardIcon className="mx-auto h-16 w-16 text-gray-400" />
            <CardTitle className="text-xl">Store Details</CardTitle>
            <CardDescription>
              This page is under construction. Store details features will be
              available soon.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
