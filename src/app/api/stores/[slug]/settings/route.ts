import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { stores, storeSettings } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

// PUT /api/stores/[slug]/settings - Update store settings
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;
    const body = (await request.json()) as {
      contactEmail?: string;
      shippingPolicy?: string;
      returnPolicy?: string;
      privacyPolicy?: string;
      termsOfService?: string;
    };
    const {
      contactEmail,
      shippingPolicy,
      returnPolicy,
      privacyPolicy,
      termsOfService,
    } = body;

    // Find the store
    const storeData = await db
      .select()
      .from(stores)
      .where(eq(stores.slug, slug))
      .limit(1);

    if (storeData.length === 0) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const store = storeData[0];

    // Verify ownership
    if (store.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: "You do not have access to this store" },
        { status: 403 },
      );
    }

    // Check if settings already exist
    const existingSettings = await db
      .select()
      .from(storeSettings)
      .where(eq(storeSettings.storeId, store.id))
      .limit(1);

    const settingsData = {
      contactEmail: contactEmail?.trim() ?? null,
      shippingPolicy: shippingPolicy?.trim() ?? null,
      returnPolicy: returnPolicy?.trim() ?? null,
      privacyPolicy: privacyPolicy?.trim() ?? null,
      termsOfService: termsOfService?.trim() ?? null,
      updatedAt: new Date(),
    };

    let result;
    if (existingSettings.length > 0) {
      // Update existing settings
      [result] = await db
        .update(storeSettings)
        .set(settingsData)
        .where(eq(storeSettings.storeId, store.id))
        .returning();
    } else {
      // Create new settings
      [result] = await db
        .insert(storeSettings)
        .values({
          storeId: store.id,
          ...settingsData,
        })
        .returning();
    }

    return NextResponse.json({
      contactEmail: result.contactEmail,
      shippingPolicy: result.shippingPolicy,
      returnPolicy: result.returnPolicy,
      privacyPolicy: result.privacyPolicy,
      termsOfService: result.termsOfService,
    });
  } catch (error) {
    console.error("Error updating store settings:", error);
    return NextResponse.json(
      { error: "Failed to update store settings" },
      { status: 500 },
    );
  }
}
