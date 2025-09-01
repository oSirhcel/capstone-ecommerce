import { ProductForm } from "@/components/admin/products/product-form";

// Mock product data for editing
const productData = {
  name: "Wireless Bluetooth Headphones",
  sku: "WBH-001",
  description:
    "Premium wireless headphones with active noise cancellation, 30-hour battery life, and superior sound quality. Perfect for music lovers and professionals who demand the best audio experience.",
  shortDescription:
    "Premium wireless headphones with active noise cancellation and 30-hour battery life.",
  price: 79.99,
  compareAtPrice: 99.99,
  costPerItem: 45.0,
  category: "electronics",
  tags: "wireless, bluetooth, headphones, audio, noise-cancelling",
  trackQuantity: true,
  quantity: 45,
  allowBackorders: false,
  weight: 0.35,
  dimensions: {
    length: 20,
    width: 18,
    height: 8,
  },
  seoTitle: "Wireless Bluetooth Headphones - Premium Audio Experience",
  seoDescription:
    "Experience superior sound quality with our premium wireless Bluetooth headphones featuring active noise cancellation and 30-hour battery life.",
  slug: "wireless-bluetooth-headphones",
  status: "active" as const,
  featured: true,
};

interface EditProductPageProps {
  params: {
    id: string;
  };
}

export default function EditProductPage({ params }: EditProductPageProps) {
  return <ProductForm initialData={productData} isEditing={true} />;
}
