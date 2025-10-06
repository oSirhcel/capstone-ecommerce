import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Eye, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ProductHeaderProps {
  product: {
    id: string;
    name: string;
    sku: string;
    status: string;
    featured: boolean;
    price: number;
    compareAtPrice?: number;
  };
}

export function ProductHeader({ product }: ProductHeaderProps) {
  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "default";
      case "draft":
        return "secondary";
      case "archived":
        return "outline";
      default:
        return "secondary";
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/products">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Link>
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">
              {product.name}
            </h1>
            <Badge variant={getStatusVariant(product.status)}>
              {product.status}
            </Badge>
            {product.featured && <Badge variant="outline">Featured</Badge>}
          </div>
          <p className="text-muted-foreground">SKU: {product.sku}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" asChild>
          <Link href={`/product/${product.slug || product.id}`} target="_blank">
            <Eye className="mr-2 h-4 w-4" />
            View Live
          </Link>
        </Button>
        <Button asChild>
          <Link href={`/admin/products/${product.id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Product
          </Link>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Duplicate Product</DropdownMenuItem>
            <DropdownMenuItem>Export Data</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">
              Delete Product
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
