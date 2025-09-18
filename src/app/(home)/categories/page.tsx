import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TagIcon } from "lucide-react";

export default function AllCategoriesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            All Categories
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Browse all available product categories in our marketplace.
          </p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <TagIcon className="mx-auto h-16 w-16 text-gray-400" />
            <CardTitle className="text-xl">Categories Page</CardTitle>
            <CardDescription>
              This page is under construction. Category browsing features will
              be available soon.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Features coming soon:
            </p>
            <ul className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              <li>• Browse all categories</li>
              <li>• Filter and search categories</li>
              <li>• View category statistics</li>
              <li>• Popular categories section</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
