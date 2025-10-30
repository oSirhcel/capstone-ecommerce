import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { storePaymentProviders, stores } from "@/server/db/schema";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function GET(_request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const storeRow = await db
      .select({ id: stores.id })
      .from(stores)
      .where(eq(stores.ownerId, session.user.id))
      .limit(1);
    if (storeRow.length === 0) return NextResponse.json({ providers: [] });
    const storeId = String(storeRow[0].id);
    const providers = await db
      .select()
      .from(storePaymentProviders)
      .where(eq(storePaymentProviders.storeId, storeId));
    return NextResponse.json({ providers });
  } catch (error) {
    console.error("Error fetching payment providers:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment providers" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = (await request.json()) as {
      provider: string;
      isActive?: boolean;
    };
    if (!body.provider)
      return NextResponse.json({ error: "provider required" }, { status: 400 });
    const storeRow = await db
      .select({ id: stores.id })
      .from(stores)
      .where(eq(stores.ownerId, session.user.id))
      .limit(1);
    if (storeRow.length === 0)
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    const storeId = String(storeRow[0].id);
    const [updated] = await db
      .update(storePaymentProviders)
      .set({ isActive: !!body.isActive, updatedAt: new Date() })
      .where(
        and(
          eq(storePaymentProviders.storeId, storeId),
          eq(storePaymentProviders.provider, body.provider),
        ),
      )
      .returning();
    if (!updated)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ provider: updated });
  } catch (error) {
    console.error("Error updating payment provider:", error);
    return NextResponse.json(
      { error: "Failed to update payment provider" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get("provider");
    if (!provider)
      return NextResponse.json({ error: "provider required" }, { status: 400 });
    const storeRow = await db
      .select({ id: stores.id })
      .from(stores)
      .where(eq(stores.ownerId, session.user.id))
      .limit(1);
    if (storeRow.length === 0)
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    const storeId = String(storeRow[0].id);
    const [deleted] = await db
      .delete(storePaymentProviders)
      .where(
        and(
          eq(storePaymentProviders.storeId, storeId),
          eq(storePaymentProviders.provider, provider),
        ),
      )
      .returning();
    if (!deleted)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error disconnecting payment provider:", error);
    return NextResponse.json(
      { error: "Failed to disconnect payment provider" },
      { status: 500 },
    );
  }
}
