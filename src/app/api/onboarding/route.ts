import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/server/db";
import { stores } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const existing = await db
    .select()
    .from(stores)
    .where(eq(stores.ownerId, userId))
    .limit(1);
  const hasStore = existing.length > 0;
  return NextResponse.json({ hasStore, store: hasStore ? existing[0] : null });
}

type CreateStoreBody = { name: string; description?: string };

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as CreateStoreBody | null;
  const name = body?.name ?? "";
  const description = body?.description ?? "";
  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const userId = session.user.id;

  const existing = await db
    .select()
    .from(stores)
    .where(eq(stores.ownerId, userId))
    .limit(1);
  if (existing.length > 0) {
    return NextResponse.json(
      { error: "Store already exists" },
      { status: 409 },
    );
  }

  const newStoreId = crypto.randomUUID();

  await db.insert(stores).values({
    id: newStoreId,
    name,
    description,
    ownerId: userId,
  });

  return NextResponse.json({ id: newStoreId }, { status: 201 });
}
