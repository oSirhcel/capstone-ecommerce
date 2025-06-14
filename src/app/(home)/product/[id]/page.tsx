import { Breadcrumb } from "@/components/product/breadcrumb";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductInfo } from "@/components/product/product-info";
import { ProductTabs } from "@/components/product/product-tabs";
import { RelatedProducts } from "@/components/product/related-products";
import { StoreInfo } from "@/components/product/store-info";

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;

  type Product = {
    id: string;
    name: string;
    price: number;
    discountPrice: number;
    rating: number;
    reviewCount: number;
    stock: number;
    sku: string;
    description: string;
    features: string[];
    specifications: { name: string; value: string }[];
    images: string[];
    options: {
      id: string;
      name: string;
      values: string[];
    }[];
    category: string;
    tags: string[];
    store: {
      id: string;
      name: string;
      logo: string;
      rating: number;
      productCount: number;
      joinedDate: string;
    };
  };

  const product: Product = {
    id: id,
    name: "Girls' Casual Knit Tops",
    price: 799,
    discountPrice: 649,
    rating: 4.5,
    reviewCount: 58,
    stock: 150,
    sku: "GJT-KNT-CSL-001",
    description:
      "Comfortable and stylish knit tops for girls, perfect for casual wear. Available in a range of vibrant colors.",
    features: [
      "Soft knit fabric",
      "Comfortable fit",
      "Easy care",
      "Variety of colors",
      "Ideal for everyday wear",
    ],
    specifications: [
      { name: "Material", value: "Cotton Blend Knit" },
      { name: "Sleeve Style", value: "Short Sleeve" },
      { name: "Neckline", value: "Round Neck" },
      { name: "Occasion", value: "Casual" },
      { name: "Care Instructions", value: "Machine Wash" },
    ],
    images: [
      "http://assets.myntassets.com/v1/images/style/properties/f3964f76c78edd85f4512d98b26d52e9_images.jpg",
      "http://assets.myntassets.com/v1/images/style/properties/dce310e4c15223a6c964631190263284_images.jpg",
      "http://assets.myntassets.com/v1/images/style/properties/fc3c1b46906d5c148c45f532d0b3ffb5_images.jpg",
      "http://assets.myntassets.com/v1/images/style/properties/ef9685293a987f515492addd034006bf_images.jpg",
    ],
    options: [
      {
        id: "color",
        name: "Color",
        values: ["White", "Black", "Blue", "Pink"],
      },
      { id: "size", name: "Size", values: ["S", "M", "L", "XL"] },
    ],
    category: "Apparel",
    tags: ["girls", "topwear", "tops", "casual", "knit"],
    store: {
      id: "store-gini-doodle",
      name: "Gini and Jony / Doodle Kids",
      logo: "/placeholder.svg",
      rating: 4.2,
      productCount: 120,
      joinedDate: "2020-05-15",
    },
  };

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-8 md:px-6">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: product.category, href: `#` },
            { label: product.name, href: `#`, current: true },
          ]}
        />

        <div className="mt-6 grid gap-8 lg:grid-cols-2">
          <ProductGallery images={product.images} />

          <div className="space-y-8">
            <ProductInfo product={product} />
            <StoreInfo store={product.store} />
          </div>
        </div>

        <ProductTabs product={product} />

        <section className="mt-16">
          <h2 className="mb-8 text-2xl font-bold">Related Products</h2>
          <RelatedProducts
            category={product.category}
            currentProductId={product.id}
          />
        </section>
      </div>
    </div>
  );
}
