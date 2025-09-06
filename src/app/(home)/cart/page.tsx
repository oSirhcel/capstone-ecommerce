import { CartOverviewClient } from "./page-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shopping Cart | Your Store",
  description: "Review your cart items and proceed to checkout",
};

export default function CartPage() {
  return <CartOverviewClient />;
}
