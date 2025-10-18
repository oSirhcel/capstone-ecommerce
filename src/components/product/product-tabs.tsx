"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductReviews } from "@/components/product/product-reviews";

interface ProductTabsProps {
  product: {
    id: string;
    description: string;
    features: string[];
    specifications: { name: string; value: string }[];
  };
}

export function ProductTabs({ product }: ProductTabsProps) {
  return (
    <div className="mt-12">
      <Tabs defaultValue="description" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="description">Description</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="specifications">Specifications</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
        </TabsList>
        <TabsContent value="description" className="text-muted-foreground mt-6">
          <p className="whitespace-pre-line">{product.description}</p>
        </TabsContent>
        <TabsContent value="features" className="mt-6">
          <ul className="text-muted-foreground list-inside list-disc space-y-2">
            {product.features.map((feature, index) => (
              <li key={index}>{feature}</li>
            ))}
          </ul>
        </TabsContent>
        <TabsContent value="specifications" className="mt-6">
          <div className="overflow-hidden rounded-md border">
            <table className="w-full text-sm">
              <tbody className="divide-y">
                {product.specifications.map((spec, index) => (
                  <tr
                    key={index}
                    className={index % 2 === 0 ? "bg-muted/50" : ""}
                  >
                    <td className="px-4 py-2 font-medium">{spec.name}</td>
                    <td className="text-muted-foreground px-4 py-2">
                      {spec.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
        <TabsContent value="reviews" className="mt-6">
          <ProductReviews productId={parseInt(product.id)} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
