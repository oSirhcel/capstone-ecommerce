import { StorePageClient } from "./page-client";

export default async function StorePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const storeSlug = (await params).slug;

  return <StorePageClient slug={storeSlug} />;
}
