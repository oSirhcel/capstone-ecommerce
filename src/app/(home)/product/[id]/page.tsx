import { notFound } from "next/navigation";
import { ProductPageClient } from "./page-client";

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const productId = parseInt(id);

  if (isNaN(productId)) {
    notFound();
  }

  return <ProductPageClient productId={productId} />;
}
