import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import { storePaymentProviders, stores } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    if (!code)
      return NextResponse.json({ error: "Missing code" }, { status: 400 });

    // Simulate exchanging code for Stripe Account ID
    const stripeAccountId = `acct_${Math.random().toString(36).slice(2, 10)}`;

    const storeRow = await db
      .select({ id: stores.id })
      .from(stores)
      .where(eq(stores.ownerId, session.user.id))
      .limit(1);
    if (storeRow.length === 0)
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    const storeId = String(storeRow[0].id);

    // Upsert provider row
    const existing = await db
      .select()
      .from(storePaymentProviders)
      .where(eq(storePaymentProviders.storeId, storeId))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(storePaymentProviders)
        .set({
          provider: "stripe",
          stripeAccountId,
          stripeAccountStatus: "active",
          isActive: true,
          connectedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(storePaymentProviders.storeId, storeId));
    } else {
      await db.insert(storePaymentProviders).values({
        storeId,
        provider: "stripe",
        stripeAccountId,
        stripeAccountStatus: "active",
        isActive: true,
        connectedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return NextResponse.redirect(
      new URL("/admin/settings/payments", request.url),
    );
  } catch (error) {
    console.error("Stripe connect callback error:", error);
    return NextResponse.json(
      { error: "Failed to connect Stripe" },
      { status: 500 },
    );
  }
}
