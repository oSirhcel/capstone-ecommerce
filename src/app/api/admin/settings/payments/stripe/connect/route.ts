import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Initiate Stripe Connect - returns a mocked URL for now
export async function POST() {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // In a real flow, generate a Stripe Connect URL with state
  const url = `/api/admin/settings/payments/stripe/callback?code=mock_code&state=mock_state`;
  return NextResponse.json({ url });
}
