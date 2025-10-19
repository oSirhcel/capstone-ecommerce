import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { stores } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  // Validate slug format
  if (!/^[a-z0-9-]{3,50}$/.test(slug)) {
    return NextResponse.json({
      available: false,
      error: "Invalid slug format",
    });
  }

  const existing = await db
    .select()
    .from(stores)
    .where(eq(stores.slug, slug))
    .limit(1);

  return NextResponse.json({ available: existing.length === 0 });
}
