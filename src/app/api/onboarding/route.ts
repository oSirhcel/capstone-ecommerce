import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import { stores } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await auth();
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

type CreateStoreBody = {
  name: string;
  description?: string;
  slug: string;
};

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as CreateStoreBody | null;
  const name = body?.name ?? "";
  const description = body?.description ?? "";
  const slug = body?.slug ?? "";

  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  if (!slug || typeof slug !== "string") {
    return NextResponse.json({ error: "Slug is required" }, { status: 400 });
  }

  if (!/^[a-z0-9-]{3,50}$/.test(slug)) {
    return NextResponse.json({ error: "Invalid slug format" }, { status: 400 });
  }

  // Check if slug is taken
  const existingSlug = await db
    .select()
    .from(stores)
    .where(eq(stores.slug, slug))
    .limit(1);

  if (existingSlug.length > 0) {
    return NextResponse.json(
      { error: "Slug is already taken" },
      { status: 409 },
    );
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
    slug,
    description,
    ownerId: userId,
  });

  return NextResponse.json({ id: newStoreId, slug }, { status: 201 });
}
