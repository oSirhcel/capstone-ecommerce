import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import { addresses } from "@/server/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";

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
      .where(and(eq(addresses.userId, user.id), isNull(addresses.archivedAt)));

    return NextResponse.json({ addresses: rows });
  } catch (error) {
    console.error("Get addresses error:", error);
    return NextResponse.json(
      { error: "Failed to get addresses" },
      { status: 500 },
    );
  }
}

// POST /api/addresses - Create a new address
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as SessionUser;
    const createSchema = z.object({
      type: z.enum(["shipping", "billing"]),
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      addressLine1: z.string().min(1),
      addressLine2: z.string().optional().nullable(),
      city: z.string().min(1),
      state: z.string().min(1),
      postalCode: z.string().min(1),
      country: z.string().min(2),
      isDefault: z.boolean().optional(),
    });

    const {
      type,
      firstName,
      lastName,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      isDefault,
    } = createSchema.parse(await request.json());

    // If setting as default, unset other defaults of same type for this user in a transaction
    const result = await db.transaction(async (tx) => {
      if (isDefault === true) {
        await tx
          .update(addresses)
          .set({ isDefault: false, updatedAt: new Date() })
          .where(and(eq(addresses.userId, user.id), eq(addresses.type, type)));
      }

      const [row] = await tx
        .insert(addresses)
        .values({
          userId: user.id,
          type,
          firstName,
          lastName,
          addressLine1,
          addressLine2,
          city,
          state,
          postalCode,
          country,
          isDefault: Boolean(isDefault),
        })
        .returning();
      return row;
    });

    return NextResponse.json({ address: result }, { status: 201 });
  } catch (error) {
    console.error("Create address error:", error);
    return NextResponse.json(
      { error: "Failed to create address" },
      { status: 500 },
    );
  }
}

// PATCH /api/addresses?id=123 - Update an address with optimistic concurrency
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as SessionUser;
    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get("id");
    const id = idParam ? parseInt(idParam, 10) : NaN;
    if (!id || Number.isNaN(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const updateSchema = z
      .object({
        version: z.number(),
        isDefault: z.boolean().optional(),
        type: z.enum(["shipping", "billing"]).optional(),
        firstName: z.string().min(1).optional(),
        lastName: z.string().min(1).optional(),
        addressLine1: z.string().min(1).optional(),
        addressLine2: z.string().optional().nullable(),
        city: z.string().min(1).optional(),
        state: z.string().min(1).optional(),
        postalCode: z.string().min(1).optional(),
        country: z.string().min(2).optional(),
      })
      .strict();

    const parsed = updateSchema.parse(await request.json());
    const { version, isDefault, ...updates } = parsed;

    const updated = await db.transaction(async (tx) => {
      if (isDefault === true && updates.type) {
        await tx
          .update(addresses)
          .set({ isDefault: false, updatedAt: new Date() })
          .where(
            and(
              eq(addresses.userId, user.id),
              eq(addresses.type, updates.type),
            ),
          );
      }

      const [row] = await tx
        .update(addresses)
        .set({
          ...updates,
          isDefault: isDefault === undefined ? undefined : Boolean(isDefault),
          version: version + 1,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(addresses.id, id),
            eq(addresses.userId, user.id),
            eq(addresses.version, version),
          ),
        )
        .returning();

      if (!row) {
        return null;
      }
      return row;
    });

    if (!updated) {
      return NextResponse.json({ error: "Conflict" }, { status: 409 });
    }

    return NextResponse.json({ address: updated });
  } catch (error) {
    console.error("Update address error:", error);
    return NextResponse.json(
      { error: "Failed to update address" },
      { status: 500 },
    );
  }
}

// DELETE /api/addresses?id=123 - Soft delete (archive) an address
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as SessionUser;
    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get("id");
    const id = idParam ? parseInt(idParam, 10) : NaN;
    if (!id || Number.isNaN(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const [row] = await db
      .update(addresses)
      .set({ archivedAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          eq(addresses.id, id),
          eq(addresses.userId, user.id),
          isNull(addresses.archivedAt),
        ),
      )
      .returning();

    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete address error:", error);
    return NextResponse.json(
      { error: "Failed to delete address" },
      { status: 500 },
    );
  }
}
