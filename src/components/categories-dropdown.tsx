"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronDownIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Category {
  id: number;
  name: string;
  description: string | null;
}

interface CategoriesResponse {
  categories: Category[];
  total: number;
}

export function CategoriesDropdown() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch("/api/categories");
        if (response.ok) {
          const data: CategoriesResponse = await response.json();
          setCategories(data.categories);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchCategories();
  }, []);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="text-muted-foreground hover:text-primary h-auto p-0 text-sm font-medium transition-colors"
        >
          Categories
          {/* <ChevronDownIcon className="ml-1 h-3 w-3" /> */}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-screen max-w-none rounded-none border-r-0 border-l-0"
        sideOffset={0}
      >
        <div className="border-b bg-white shadow-sm dark:bg-gray-900">
          <div className="container mx-auto px-4 py-3">
            <div className="flex flex-wrap items-center gap-4">
              {/* All Categories Button */}
              <Link
                href="/categories"
                className="text-primary hover:text-primary/80 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => setIsOpen(false)}
              >
                All Categories
              </Link>

              {/* Category Links */}
              {isLoading ? (
                <div className="flex gap-4">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="h-6 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700"
                    />
                  ))}
                </div>
              ) : (
                categories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/categories/${category.id}`}
                    className="hover:text-primary rounded-md px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                    onClick={() => setIsOpen(false)}
                  >
                    {category.name}
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
