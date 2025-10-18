import CustomerDetailPageClient from "./page-client";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <CustomerDetailPageClient customerId={id} />;
}
