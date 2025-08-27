import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductHeader } from "@/components/admin/products/product-header";
import { ProductGallery } from "@/components/admin/products/product-gallery";
import { ProductDetails } from "@/components/admin/products/product-details";
import { ProductInventory } from "@/components/admin/products/product-inventory";
import { ProductSeo } from "@/components/admin/products/product-seo";
import { ProductAnalytics } from "@/components/admin/products/product-analytics";
import { ProductReviews } from "@/components/admin/products/product-reviews";

// Mock product data
const product = {
  id: "1",
  name: "Wireless Bluetooth Headphones",
  sku: "WBH-001",
  description:
    "Premium wireless headphones with active noise cancellation, 30-hour battery life, and superior sound quality. Perfect for music lovers and professionals who demand the best audio experience.",
  shortDescription:
    "Premium wireless headphones with active noise cancellation and 30-hour battery life.",
  price: 79.99,
  compareAtPrice: 99.99,
  costPerItem: 45.0,
  category: "Electronics",
  tags: ["wireless", "bluetooth", "headphones", "audio", "noise-cancelling"],
  status: "Active",
  featured: true,
  images: [
    "/headphones-front.png",
    "/headphones-side.png",
    "/headphones-back.png",
  ],
  inventory: {
    trackQuantity: true,
    quantity: 45,
    allowBackorders: false,
    weight: 0.35,
    dimensions: {
      length: 20,
      width: 18,
      height: 8,
    },
  },
  seo: {
    title: "Wireless Bluetooth Headphones - Premium Audio Experience",
    description:
      "Experience superior sound quality with our premium wireless Bluetooth headphones featuring active noise cancellation and 30-hour battery life.",
    slug: "wireless-bluetooth-headphones",
  },
  analytics: {
    views: 1250,
    sales: 234,
    revenue: 18706.66,
    conversionRate: 18.7,
  },
  reviews: {
    average: 4.5,
    total: 89,
    distribution: {
      5: 45,
      4: 32,
      3: 8,
      2: 3,
      1: 1,
    },
  },
  createdAt: "2024-01-15T10:30:00Z",
  updatedAt: "2024-01-20T14:45:00Z",
};

interface ProductPageProps {
  params: {
    id: string;
  };
}

export default function ProductPage({ params }: ProductPageProps) {
  return (
    <div className="space-y-6">
      <ProductHeader product={product} />

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
              <ProductDetails product={product} />
            </TabsContent>

            <TabsContent value="inventory">
              <ProductInventory inventory={product.inventory} />
            </TabsContent>

            <TabsContent value="seo">
              <ProductSeo seo={product.seo} />
            </TabsContent>

            <TabsContent value="reviews">
              <ProductReviews reviews={product.reviews} />
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <ProductAnalytics analytics={product.analytics} />

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
}
