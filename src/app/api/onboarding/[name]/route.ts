import { db } from "@/server/db";
import { stores } from "@/server/db/schema";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function GET(
  _req: Request,
  { params }: { params: { name: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name } = params;
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
