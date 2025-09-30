import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import { addresses } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

type SessionUser = {
  id: string;
};

// GET /api/addresses - Get user's addresses
export async function GET(_request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as SessionUser;
    const rows = await db
      .select()
      .from(addresses)
      .where(eq(addresses.userId, user.id));

    return NextResponse.json({ addresses: rows });
  } catch (error) {
    console.error("Get addresses error:", error);
    return NextResponse.json({ error: "Failed to get addresses" }, { status: 500 });
  }
}


