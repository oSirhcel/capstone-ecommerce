import { Breadcrumb } from "@/components/product/breadcrumb";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductInfo } from "@/components/product/product-info";
import { ProductTabs } from "@/components/product/product-tabs";
import { RelatedProducts } from "@/components/product/related-products";
import { StoreInfo } from "@/components/product/store-info";
import { fetchProduct } from "@/lib/api/products";
import { notFound } from "next/navigation";

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const productId = parseInt(id);

  if (isNaN(productId)) {
    notFound();
  }

  // Fetch product data from API
  let product;
  try {
    product = await fetchProduct(productId);
    console.log(product);
  } catch (error) {
    console.error("Failed to fetch product:", error);
    notFound();
  }

  // Transform the API data to match the component expectations
  const transformedProduct = {
    id: product.id.toString(),
    name: product.name,
    price: product.price / 100, // Convert from cents to dollars
    discountPrice: product.price / 100, // No discount for now
    rating: 4.0, // Default rating
    reviewCount: 0, // Default review count
    stock: product.stock,
    sku: `${product.id.toString().padStart(6, "0")}`,
    description: product.description ?? "No description available",
    features: [
      "High quality product",
      "Fast shipping",
      "Customer satisfaction guaranteed",
    ],
    specifications: [
      { name: "Product ID", value: product.id.toString() },
      { name: "Category", value: product.category?.name ?? "Uncategorized" },
      { name: "Store", value: product.store?.name ?? "Unknown Store" },
      { name: "Stock", value: product.stock.toString() },
      { name: "Added", value: product.createdAt.toLocaleString() },
    ],
    images: product.images.map((img) => img.imageUrl),
    options: [
      {
        id: "size",
        name: "Size",
        values: ["S", "M", "L", "XL"],
      },
    ],
    category: product.category?.name ?? "Uncategorized",
    tags: [
      "product",
      product.category?.name?.toLowerCase() ?? "general",
    ].filter(Boolean),
    store: {
      id: product.store?.id ?? "unknown",
      name: product.store?.name ?? "Unknown Store",
      logo: "/placeholder.svg",
      rating: 4.0, // Default rating
      productCount: 0, // Will be updated when store API is integrated
      joinedDate: "Unknown", // Store creation date not available in current schema
    },
  };

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-8 md:px-6">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: transformedProduct.category, href: `#` },
            { label: transformedProduct.name, href: `#`, current: true },
          ]}
        />

        <div className="mt-6 grid gap-8 lg:grid-cols-2">
          <ProductGallery images={transformedProduct.images} />

          <div className="space-y-8">
            <ProductInfo product={transformedProduct} />
            <StoreInfo store={transformedProduct.store} />
          </div>
        </div>

        <ProductTabs product={transformedProduct} />

        <section className="mt-16">
          <h2 className="mb-8 text-2xl font-bold">Related Products</h2>
          <RelatedProducts
            category={transformedProduct.category}
            currentProductId={transformedProduct.id}
          />
        </section>
      </div>
    </div>
  );
}
