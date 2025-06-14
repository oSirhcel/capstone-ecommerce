"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProductReviews } from "@/components/product/product-reviews"

interface ProductTabsProps {
  product: {
    description: string
    features: string[]
    specifications: { name: string; value: string }[]
  }
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
        <TabsContent value="description" className="mt-6 text-muted-foreground">
          <p className="whitespace-pre-line">{product.description}</p>
        </TabsContent>
        <TabsContent value="features" className="mt-6">
          <ul className="list-inside list-disc space-y-2 text-muted-foreground">
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
                  <tr key={index} className={index % 2 === 0 ? "bg-muted/50" : ""}>
                    <td className="px-4 py-2 font-medium">{spec.name}</td>
                    <td className="px-4 py-2 text-muted-foreground">{spec.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
        <TabsContent value="reviews" className="mt-6">
          <ProductReviews />
        </TabsContent>
      </Tabs>
    </div>
  )
}
