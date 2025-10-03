"use client";
import { useProduct } from "@/hooks/products/use-product";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductHeader } from "@/components/admin/products/product-header";
import { ProductGallery } from "@/components/admin/products/product-gallery";
import { ProductDetails } from "@/components/admin/products/product-details";
import { ProductInventory } from "@/components/admin/products/product-inventory";
import { ProductSeo } from "@/components/admin/products/product-seo";
import { ProductReviews } from "@/components/admin/products/product-reviews";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProductAnalytics } from "@/components/admin/products/product-analytics";

export const ProductPageClient = ({ id }: { id: number }) => {
  const { data: product, isLoading, error } = useProduct(id);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Skeleton className="h-96 w-full" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">
            Product not found
          </h2>
          <p className="mt-2 text-gray-600">
            The product you&apos;re looking for doesn&apos;t exist.
          </p>
        </div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  // Transform database product to match component expectations
  const transformedProduct = {
    id: product.id.toString(),
    name: product.name,
    sku: product.sku,
    description: product.description ?? "",
    price: product.price / 100, // Convert from cents to dollars
    compareAtPrice: product.compareAtPrice
      ? product.compareAtPrice / 100
      : undefined,
    costPerItem: product.costPerItem ? product.costPerItem / 100 : undefined,
    category: product.category?.name ?? "Uncategorized",
    tags: product.tags ? (JSON.parse(product.tags) as string[]) : [],
    status: product.status,
    featured: product.featured,
    images: product.images,
    inventory: {
      trackQuantity: product.trackQuantity,
      quantity: product.stock,
      allowBackorders: product.allowBackorders,
      weight: product.weight ? parseFloat(product.weight) : undefined,
      dimensions: {
        length: product.length ? parseFloat(product.length) : undefined,
        width: product.width ? parseFloat(product.width) : undefined,
        height: product.height ? parseFloat(product.height) : undefined,
      },
    },
    seo: {
      title: product.seoTitle ?? product.name,
      description:
        product.seoDescription ?? product.description?.substring(0, 160) ?? "",
      slug: product.slug ?? product.name.toLowerCase().replace(/ /g, "-"),
    },
    analytics: {
      views: 0, // TODO: Implement analytics
      sales: 0,
      revenue: 0,
      conversionRate: 0,
    },
    reviews: {
      average: 0, // TODO: Implement reviews
      total: 0,
      distribution: {
        5: 0,
        4: 0,
        3: 0,
        2: 0,
        1: 0,
      },
    },
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };

  return (
    <div className="space-y-6">
      <ProductHeader product={transformedProduct} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <ProductGallery images={product.images} />

          <Tabs defaultValue="details" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>

            <TabsContent value="details">
              <ProductDetails product={transformedProduct} />
            </TabsContent>

            <TabsContent value="inventory">
              <ProductInventory inventory={transformedProduct.inventory} />
            </TabsContent>

            <TabsContent value="seo">
              <ProductSeo seo={transformedProduct.seo} />
            </TabsContent>

            <TabsContent value="reviews">
              <ProductReviews reviews={transformedProduct.reviews} />
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <ProductAnalytics analytics={transformedProduct.analytics} />

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full bg-transparent" variant="outline">
                Duplicate Product
              </Button>
              <Button className="w-full bg-transparent" variant="outline">
                Export Data
              </Button>
              <Button className="w-full" variant="destructive">
                Delete Product
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
