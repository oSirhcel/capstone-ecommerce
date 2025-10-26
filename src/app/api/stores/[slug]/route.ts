import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { stores, storeSettings } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

// GET /api/stores/[slug] - Get store details with settings
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

// PATCH /api/stores/[slug] - Update store information
export async function PATCH(
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
      name: string;
      description: string;
      slug: string;
    };
    const { name, description, slug: newSlug } = body;

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

    // If updating slug, validate it
    if (newSlug && newSlug !== slug) {
      if (!/^[a-z0-9-]{3,50}$/.test(newSlug)) {
        return NextResponse.json(
          { error: "Invalid slug format" },
          { status: 400 },
        );
      }

      // Check if new slug is available
      const existingSlug = await db
        .select()
        .from(stores)
        .where(eq(stores.slug, newSlug))
        .limit(1);

      if (existingSlug.length > 0) {
        return NextResponse.json(
          { error: "Slug is already taken" },
          { status: 409 },
        );
      }
    }

    // Update the store
    const updateData: Record<string, string | null> = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined)
      updateData.description = description?.trim() || null;
    if (newSlug) updateData.slug = newSlug.trim();

    const [updatedStore] = await db
      .update(stores)
      .set(updateData)
      .where(eq(stores.id, store.id))
      .returning();

    return NextResponse.json(updatedStore);
  } catch (error) {
    console.error("Error updating store:", error);
    return NextResponse.json(
      { error: "Failed to update store" },
      { status: 500 },
    );
  }
}
