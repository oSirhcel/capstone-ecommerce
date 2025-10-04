import { ProductPageClient } from "./page-client";

interface ProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;

  return <ProductPageClient id={parseInt(id)} />;
}
