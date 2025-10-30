import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { stores, storeSettings } from "@/server/db/schema";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function GET(_request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userStore = await db
      .select({ id: stores.id })
      .from(stores)
      .where(eq(stores.ownerId, session.user.id))
      .limit(1);

    if (userStore.length === 0) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const storeId = String(userStore[0].id);

    const settingsRows = await db
      .select({
        gstRegistered: storeSettings.gstRegistered,
        abn: storeSettings.abn,
        businessName: storeSettings.businessName,
        taxRate: storeSettings.taxRate,
        contactEmail: storeSettings.contactEmail,
      })
      .from(storeSettings)
      .where(eq(storeSettings.storeId, storeId))
      .limit(1);

    const settings = settingsRows[0] ?? null;

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Error fetching tax settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch tax settings" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      gstRegistered?: boolean;
      abn?: string | null;
      businessName?: string | null;
      taxRate?: string | number | null;
      contactEmail?: string | null;
    };

    // Basic validation
    const abn = body.abn?.trim() ?? null;
    if (abn && !/^\d{11}$/.test(abn)) {
      return NextResponse.json(
        { error: "Invalid ABN format. Must be 11 digits." },
        { status: 400 },
      );
    }

    const taxRateNumber =
      typeof body.taxRate === "string"
        ? Number(body.taxRate)
        : (body.taxRate ?? undefined);
    if (
      taxRateNumber !== undefined &&
      (Number.isNaN(taxRateNumber) || taxRateNumber < 0 || taxRateNumber > 1)
    ) {
      return NextResponse.json(
        { error: "Invalid tax rate. Must be between 0 and 1." },
        { status: 400 },
      );
    }

    const userStore = await db
      .select()
      .from(stores)
      .where(eq(stores.ownerId, session.user.id))
      .limit(1);

    if (userStore.length === 0) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const storeId = String(userStore[0].id);

    // Upsert settings
    const existing = await db
      .select()
      .from(storeSettings)
      .where(eq(storeSettings.storeId, storeId))
      .limit(1);

    const settingsData: {
      gstRegistered?: boolean;
      abn?: string | null;
      businessName?: string | null;
      taxRate?: string;
      contactEmail?: string | null;
      updatedAt: Date;
    } = {
      ...(body.gstRegistered !== undefined && {
        gstRegistered: body.gstRegistered,
      }),
      ...(abn !== undefined && { abn }),
      ...(body.businessName !== undefined && {
        businessName: body.businessName?.trim() ?? null,
      }),
      ...(taxRateNumber !== undefined && { taxRate: taxRateNumber.toString() }),
      ...(body.contactEmail !== undefined && {
        contactEmail: body.contactEmail?.trim() ?? null,
      }),
      updatedAt: new Date(),
    };

    if (existing.length > 0) {
      await db
        .update(storeSettings)
        .set(settingsData)
        .where(and(eq(storeSettings.storeId, storeId)))
        .returning();
    } else {
      await db
        .insert(storeSettings)
        .values({ storeId, ...settingsData })
        .returning();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating tax settings:", error);
    return NextResponse.json(
      { error: "Failed to update tax settings" },
      { status: 500 },
    );
  }
}
