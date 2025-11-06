import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import { storePaymentProviders, stores } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { stripe } from "@/lib/stripe";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    if (error) {
      console.error("Stripe OAuth error:", error, errorDescription);
      return NextResponse.redirect(
        new URL(
          `/admin/settings/payments?error=${encodeURIComponent(errorDescription ?? error)}`,
          request.url,
        ),
      );
    }

    if (!code)
      return NextResponse.json({ error: "Missing code" }, { status: 400 });

    // Exchange authorization code for account ID
    let stripeAccountId: string;
    let accountStatus = "pending";

    try {
      const response = await stripe.oauth.token({
        grant_type: "authorization_code",
        code: code,
      });

      stripeAccountId = response.stripe_user_id ?? "";
      // Check account status
      try {
        const account = await stripe.accounts.retrieve(stripeAccountId);
        accountStatus =
          account.details_submitted && account.charges_enabled
            ? "active"
            : account.details_submitted
              ? "pending"
              : "restricted";
      } catch (accountError) {
        console.warn("Failed to retrieve account status:", accountError);
        accountStatus = "pending";
      }
    } catch (oauthError) {
      console.error("Stripe OAuth token exchange error:", oauthError);
      return NextResponse.redirect(
        new URL(
          `/admin/settings/payments?error=${encodeURIComponent("Failed to connect Stripe account")}`,
          request.url,
        ),
      );
    }

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
          stripeAccountStatus: accountStatus,
          isActive: accountStatus === "active",
          connectedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(storePaymentProviders.storeId, storeId));
    } else {
      await db.insert(storePaymentProviders).values({
        storeId,
        provider: "stripe",
        stripeAccountId,
        stripeAccountStatus: accountStatus,
        isActive: accountStatus === "active",
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
