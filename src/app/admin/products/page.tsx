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
import { Search, Plus, Filter, Eye, Edit, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const products = [
  {
    id: "1",
    name: "Handcrafted Ceramic Mug",
    category: "Home & Living",
    price: "$24.99",
    stock: 45,
    status: "Active",
    store: "Artisan Crafts",
    image: "/placeholder.svg?height=40&width=40",
    sales: 127,
    rating: 4.8,
  },
  {
    id: "2",
    name: "Digital Marketing Course",
    category: "Digital Products",
    price: "$129.99",
    stock: 999,
    status: "Active",
    store: "Digital Academy",
    image: "/placeholder.svg?height=40&width=40",
    sales: 89,
    rating: 4.9,
  },
  {
    id: "3",
    name: "Organic Cotton T-Shirt",
    category: "Clothing",
    price: "$34.99",
    stock: 12,
    status: "Low Stock",
    store: "Eco Essentials",
    image: "/placeholder.svg?height=40&width=40",
    sales: 234,
    rating: 4.6,
  },
  {
    id: "4",
    name: "Handmade Silver Earrings",
    category: "Jewelry",
    price: "$45.99",
    stock: 0,
    status: "Out of Stock",
    store: "Silver Crafts",
    image: "/placeholder.svg?height=40&width=40",
    sales: 56,
    rating: 4.7,
  },
  {
    id: "5",
    name: "Premium Coffee Beans",
    category: "Food & Beverage",
    price: "$18.99",
    stock: 78,
    status: "Active",
    store: "Coffee Roasters",
    image: "/placeholder.svg?height=40&width=40",
    sales: 312,
    rating: 4.9,
  },
];

const columns = [
  {
    header: "Product",
    accessorKey: "name",
    cell: ({ row }: any) => (
      <div className="flex items-center gap-3">
        <Image
          src={row.original.image || "/placeholder.svg"}
          alt={row.original.name}
          width={40}
          height={40}
          className="rounded-md object-cover"
        />
        <div>
          <div className="font-medium">{row.original.name}</div>
          <div className="text-muted-foreground text-sm">
            {row.original.category}
          </div>
        </div>
      </div>
    ),
  },
  {
    header: "Store",
    accessorKey: "store",
  },
  {
    header: "Price",
    accessorKey: "price",
    cell: ({ row }: any) => (
      <span className="font-medium">{row.original.price}</span>
    ),
  },
  {
    header: "Stock",
    accessorKey: "stock",
    cell: ({ row }: any) => (
      <span
        className={row.original.stock < 20 ? "font-medium text-orange-600" : ""}
      >
        {row.original.stock}
      </span>
    ),
  },
  {
    header: "Sales",
    accessorKey: "sales",
  },
  {
    header: "Rating",
    accessorKey: "rating",
    cell: ({ row }: any) => (
      <div className="flex items-center gap-1">
        <span>⭐</span>
        <span>{row.original.rating}</span>
      </div>
    ),
  },
  {
    header: "Status",
    accessorKey: "status",
    cell: ({ row }: any) => {
      const status = row.original.status;
      let variant: "default" | "secondary" | "destructive" = "default";

      if (status === "Low Stock") variant = "secondary";
      if (status === "Out of Stock") variant = "destructive";

      return <Badge variant={variant}>{status}</Badge>;
    },
  },
  {
    header: "Actions",
    cell: ({ row }: any) => (
      <div className="flex gap-1">
        <Link href={`/admin/products/${row.original.id}`}>
          <Button variant="ghost" size="sm">
            <Eye className="h-4 w-4" />
          </Button>
        </Link>
        <Link href={`/admin/products/${row.original.id}/edit`}>
          <Button variant="ghost" size="sm">
            <Edit className="h-4 w-4" />
          </Button>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          className="text-red-600 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    ),
  },
];

export default function ProductsPage() {
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
                <p className="text-2xl font-bold">1,247</p>
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
                <p className="text-2xl font-bold">1,189</p>
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
                <p className="text-2xl font-bold">23</p>
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
                <p className="text-2xl font-bold">35</p>
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
          <div className="mb-6 flex items-center gap-4">
            <div className="relative max-w-sm flex-1">
              <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
              <Input placeholder="Search products..." className="pl-8" />
            </div>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </div>
          <DataTable columns={columns} data={products} />
        </CardContent>
      </Card>
    </div>
  );
}
