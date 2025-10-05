import { ProductEditPageClient } from "./page-client";

interface ProductEditPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProductEditPage({
  params,
}: ProductEditPageProps) {
  const { id } = await params;

  return <ProductEditPageClient id={parseInt(id)} />;
}
