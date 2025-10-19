import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { stores, storeSettings } from "@/server/db/schema";
import { eq } from "drizzle-orm";

// GET /api/stores/[id] - Get store details with settings
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

    const storeData = await db
      .select()
      .from(stores)
      .where(eq(stores.slug, slug))
      .limit(1);

    if (storeData.length === 0) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const store = storeData[0];

    const settingsData = await db
      .select()
      .from(storeSettings)
      .where(eq(storeSettings.storeId, store.id))
      .limit(1);

    const settings = settingsData[0] || null;

    return NextResponse.json({
      id: store.id,
      name: store.name,
      slug: store.slug,
      description: store.description,
      ownerId: store.ownerId,
      createdAt: store.createdAt,
      settings: settings
        ? {
            contactEmail: settings.contactEmail,
            shippingPolicy: settings.shippingPolicy,
            returnPolicy: settings.returnPolicy,
            privacyPolicy: settings.privacyPolicy,
            termsOfService: settings.termsOfService,
          }
        : null,
    });
  } catch (error) {
    console.error("Error fetching store:", error);
    return NextResponse.json(
      { error: "Failed to fetch store" },
      { status: 500 },
    );
  }
}
