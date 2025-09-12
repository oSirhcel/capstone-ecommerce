import { CheckoutClient } from "./page-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout | Your Store",
  description: "Complete your purchase securely",
};

export default function CheckoutPage() {
  return <CheckoutClient />;
}
