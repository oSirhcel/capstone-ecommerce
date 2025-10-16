import { notFound } from "next/navigation";
import { ProductPageClient } from "./page-client";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;

  if (!slug || slug.trim() === "") {
    notFound();
  }

  return <ProductPageClient productSlug={slug} />;
}
