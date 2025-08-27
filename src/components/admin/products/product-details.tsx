import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ProductDetailsProps {
  product: {
    name: string;
    description: string;
    shortDescription?: string;
    price: number;
    compareAtPrice?: number;
    costPerItem?: number;
    category: string;
    tags: string[];
    status: string;
    featured: boolean;
  };
}

export function ProductDetails({ product }: ProductDetailsProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Product Information</CardTitle>
          <CardDescription>Basic details about this product</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-muted-foreground mb-1 text-sm font-medium">
              Description
            </h3>
            <p className="text-sm">{product.description}</p>
          </div>

          {product.shortDescription && (
            <div>
              <h3 className="text-muted-foreground mb-1 text-sm font-medium">
                Short Description
              </h3>
              <p className="text-sm">{product.shortDescription}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-muted-foreground mb-1 text-sm font-medium">
                Category
              </h3>
              <p className="text-sm">{product.category}</p>
            </div>
            <div>
              <h3 className="text-muted-foreground mb-1 text-sm font-medium">
                Status
              </h3>
              <Badge
                variant={product.status === "Active" ? "default" : "secondary"}
              >
                {product.status}
              </Badge>
            </div>
          </div>

          <div>
            <h3 className="text-muted-foreground mb-2 text-sm font-medium">
              Tags
            </h3>
            <div className="flex flex-wrap gap-1">
              {product.tags.map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pricing</CardTitle>
          <CardDescription>Product pricing information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <h3 className="text-muted-foreground mb-1 text-sm font-medium">
                Price
              </h3>
              <p className="text-2xl font-bold">${product.price}</p>
            </div>
            {product.compareAtPrice && (
              <div>
                <h3 className="text-muted-foreground mb-1 text-sm font-medium">
                  Compare at Price
                </h3>
                <p className="text-muted-foreground text-lg line-through">
                  ${product.compareAtPrice}
                </p>
              </div>
            )}
            {product.costPerItem && (
              <div>
                <h3 className="text-muted-foreground mb-1 text-sm font-medium">
                  Cost per Item
                </h3>
                <p className="text-lg">${product.costPerItem}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
