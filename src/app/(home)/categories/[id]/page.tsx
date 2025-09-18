import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PackageIcon } from "lucide-react";

interface CategoryPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { id } = await params;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Category {id}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Products in this category will be displayed here.
          </p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <PackageIcon className="mx-auto h-16 w-16 text-gray-400" />
            <CardTitle className="text-xl">Category Products</CardTitle>
            <CardDescription>
              This page is under construction. Category-specific product
              listings will be available soon.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Features coming soon:
            </p>
            <ul className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              <li>• View products in this category</li>
              <li>• Filter by price, rating, and availability</li>
              <li>• Sort products by various criteria</li>
              <li>• Product comparison features</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
