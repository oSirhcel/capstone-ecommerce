"use client";

import { useMemo, useState } from "react";
import { DataTable } from "@/components/admin/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Package } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";
import Link from "next/link";
import { useProductsQuery } from "@/hooks/products/use-products-query";
import { useCategoriesQuery } from "@/hooks/categories/use-categories-query";

import { Skeleton } from "@/components/ui/skeleton";

import { type Product } from "@/lib/api/products";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const columns = [
  {
    header: "Product",
    accessorKey: "name",
    cell: ({ row }: { row: { original: Product } }) => {
      const product = row.original;
      const primaryImage =
        product.images.find((img) => img.isPrimary) ?? product.images[0];

      return (
        <div className="flex items-center gap-3">
          <Image
            src={primaryImage?.imageUrl ?? "/placeholder.svg"}
            alt={primaryImage?.altText ?? product.name}
            width={40}
            height={40}
            className="rounded-md object-contain"
          />
          <div>
            <div className="font-medium">{product.name}</div>
            <div className="text-muted-foreground text-sm">
              {product.category?.name ?? "Uncategorized"}
            </div>
          </div>
        </div>
      );
    },
    skeleton: () => (
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-md" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    ),
  },
  {
    header: "Price",
    accessorKey: "price",
    cell: ({ row }: { row: { original: Product } }) => (
      <span className="font-medium">
        ${((row.original.price ?? 0) / 100).toFixed(2)}
      </span>
    ),
    skeleton: () => <Skeleton className="h-4 w-16" />,
  },
  {
    header: "Stock",
    accessorKey: "stock",
    cell: ({ row }: { row: { original: Product } }) => {
      const stock = row.original.stock;
      return (
        <span className={stock < 20 ? "font-medium text-orange-600" : ""}>
          {stock}
        </span>
      );
    },
    skeleton: () => <Skeleton className="h-4 w-12" />,
  },
  {
    header: "Status",
    accessorKey: "status",
    cell: ({ row }: { row: { original: Product } }) => {
      const status = row.original.status;
      const stock = row.original.stock;

      let displayStatus = status;
      let variant: "default" | "secondary" | "destructive" = "default";

      if (stock === 0) {
        displayStatus = "Out of Stock";
        variant = "destructive";
      } else if (stock < 20) {
        displayStatus = "Low Stock";
        variant = "secondary";
      } else if (status === "Active") {
        displayStatus = "Active";
        variant = "default";
      }

      return <Badge variant={variant}>{displayStatus}</Badge>;
    },
    skeleton: () => <Skeleton className="h-6 w-20 rounded-full" />,
  },
];

export default function ProductsPage() {
  const session = useSession();
  const router = useRouter();
  const storeId = session?.data?.store?.id ?? "";
  const [searchTerm, setSearchTerm] = useState("");
  type StatusFilter = "all" | "Active" | "Draft" | "Archived";
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  type StockFilter = "all" | "low" | "out";
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortOption, setSortOption] = useState<
    | "price-low"
    | "price-high"
    | "name-asc"
    | "name-desc"
    | "release-newest"
    | "release-oldest"
  >("release-newest");

  const { data: categoriesData } = useCategoriesQuery();
  const categories = categoriesData?.categories ?? [];

  const {
    data: productsData,
    isLoading,
    error,
  } = useProductsQuery({
    search: searchTerm || undefined,
    store: storeId,
    status: statusFilter === "all" ? "all" : statusFilter,
    category:
      categoryFilter === "all"
        ? undefined
        : parseInt(categoryFilter) || undefined,
    sort: sortOption,
  });

  const allProducts = useMemo(
    () => productsData?.products ?? [],
    [productsData?.products],
  );

  // Apply stock filter client-side
  const products = useMemo(() => {
    if (stockFilter === "all") return allProducts;
    if (stockFilter === "low")
      return allProducts.filter((p) => p.stock > 0 && p.stock < 20);
    if (stockFilter === "out") return allProducts.filter((p) => p.stock === 0);
    return allProducts;
  }, [allProducts, stockFilter]);

  const totalProducts = productsData?.pagination?.total ?? 0;
  const activeProducts = allProducts.filter(
    (p) => p.status === "Active",
  ).length;
  const lowStockProducts = allProducts.filter(
    (p) => p.stock > 0 && p.stock < 20,
  ).length;
  const outOfStockProducts = allProducts.filter((p) => p.stock === 0).length;

  const handleRowClick = (product: Product) => {
    router.push(`/admin/products/${product.id}/edit`);
  };

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">
            Error loading products
          </h2>
          <p className="mt-2 text-gray-600">
            There was an error loading the products. Please try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Product Management</h1>
          <p className="text-muted-foreground">
            Manage all products across your marketplace
          </p>
        </div>
        <Link href="/admin/products/add">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  Total Products
                </p>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold">{totalProducts}</p>
                )}
              </div>
              <div className="text-green-600">
                <span className="text-sm">+12%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  Active Products
                </p>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold">{activeProducts}</p>
                )}
              </div>
              <div className="text-green-600">
                <span className="text-sm">+8%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  Low Stock
                </p>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold">{lowStockProducts}</p>
                )}
              </div>
              <div className="text-orange-600">
                <span className="text-sm">+3</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  Out of Stock
                </p>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold">{outOfStockProducts}</p>
                )}
              </div>
              <div className="text-red-600">
                <span className="text-sm">+7</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Products</CardTitle>
          <CardDescription>
            A comprehensive list of all products in your marketplace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative max-w-sm flex-1">
              <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
              <Input
                placeholder="Search products..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as StatusFilter)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={stockFilter}
              onValueChange={(v) => setStockFilter(v as StockFilter)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Stock" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stock</SelectItem>
                <SelectItem value="low">Low Stock</SelectItem>
                <SelectItem value="out">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={sortOption}
              onValueChange={(v) =>
                setSortOption(
                  v as
                    | "price-low"
                    | "price-high"
                    | "name-asc"
                    | "name-desc"
                    | "release-newest"
                    | "release-oldest",
                )
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="release-newest">Newest First</SelectItem>
                <SelectItem value="release-oldest">Oldest First</SelectItem>
                <SelectItem value="price-low">Price: Low-High</SelectItem>
                <SelectItem value="price-high">Price: High-Low</SelectItem>
                <SelectItem value="name-asc">Name: A-Z</SelectItem>
                <SelectItem value="name-desc">Name: Z-A</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DataTable
            columns={columns}
            data={products}
            isLoading={isLoading}
            emptyMessage="No products found. Add your first product to get started."
            emptyIcon={<Package className="h-12 w-12 opacity-20" />}
            onRowClick={handleRowClick}
          />
        </CardContent>
      </Card>
    </div>
  );
}
