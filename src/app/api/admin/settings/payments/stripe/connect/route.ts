import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { db } from "@/server/db";
import { stores } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // Get user's store
    const storeRow = await db
      .select({ id: stores.id })
      .from(stores)
      .where(eq(stores.ownerId, session.user.id))
      .limit(1);

    if (storeRow.length === 0)
      return NextResponse.json({ error: "Store not found" }, { status: 404 });

    const storeId = String(storeRow[0].id);

    // Generate state parameter for security (storeId + random)
    const state = crypto
      .createHash("sha256")
      .update(`${storeId}-${session.user.id}-${Date.now()}`)
      .digest("hex");

    // Check if Stripe Client ID is configured
    const stripeClientId = process.env.STRIPE_CLIENT_ID;
    if (!stripeClientId) {
      console.error("STRIPE_CLIENT_ID environment variable is not set");
      return NextResponse.json(
        {
          error: "Stripe Connect not configured",
          errorCode: "STRIPE_CLIENT_ID_MISSING",
          message:
            "STRIPE_CLIENT_ID environment variable is required for Stripe Connect. Please add it to your .env.local file. Get your Client ID from Stripe Dashboard > Settings > Connect > Settings.",
        },
        { status: 500 },
      );
    }

    // Get base URL for redirect
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL;
    const redirectUri = `${baseUrl}/api/admin/settings/payments/stripe/callback`;

    // Generate Stripe Connect OAuth URL
    let url: string;
    try {
      url = stripe.oauth.authorizeUrl({
        client_id: stripeClientId,
        scope: "read_write",
        response_type: "code",
        redirect_uri: redirectUri,
        state: state,
      });
    } catch (error) {
      console.error("Failed to generate Stripe OAuth URL:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      // Check for redirect URI mismatch error
      if (
        errorMessage.includes("Invalid redirect URI") ||
        errorMessage.includes("redirect_uri")
      ) {
        return NextResponse.json(
          {
            error: "Invalid redirect URI",
            errorCode: "INVALID_REDIRECT_URI",
            message: errorMessage,
            redirectUri: redirectUri,
            details: `The redirect URI "${redirectUri}" must be added to your Stripe Connect application settings. Go to Stripe Dashboard → Settings → Connect → Settings → Redirect URIs and add this exact URI.`,
          },
          { status: 400 },
        );
      }

      return NextResponse.json(
        {
          error: "Failed to initiate Stripe Connect",
          errorCode: "OAUTH_URL_GENERATION_FAILED",
          message: errorMessage,
          details:
            "Please verify your STRIPE_CLIENT_ID is correct in your .env.local file.",
        },
        { status: 500 },
      );
    }

    // Store state in session/cookie for verification (optional but recommended)
    // For now, we'll verify it in the callback using the storeId

    return NextResponse.json({ url, state });
  } catch (error) {
    console.error("Stripe Connect OAuth initiation error:", error);
    return NextResponse.json(
      { error: "Failed to initiate Stripe Connect" },
      { status: 500 },
    );
  }
}
