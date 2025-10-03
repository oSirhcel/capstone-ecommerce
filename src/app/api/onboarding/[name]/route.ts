import { db } from "@/server/db";
import { stores } from "@/server/db/schema";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

import { eq } from "drizzle-orm";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name } = await params;
  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const existing = await db
    .select()
    .from(stores)
    .where(eq(stores.name, name))
    .limit(1);

  const hasStore = existing.length > 0;

  return NextResponse.json({ hasStore });
}
