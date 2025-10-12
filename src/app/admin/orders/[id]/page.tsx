import OrderViewPageClient from "./page-client";

export default async function OrderViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OrderViewPageClient orderId={id} />;
}
