import { Suspense } from "react";
import OrderViewPageClient from "./page-client";
import { OrderViewSkeleton } from "@/components/admin/orders/order-view-skeleton";

export default async function OrderViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<OrderViewSkeleton />}>
      <OrderViewPageClient orderId={id} />
    </Suspense>
  );
}
