import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import { addresses } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

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

    const CreateAddressSchema = z.object({
      type: z.enum(["shipping", "billing"]),
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      addressLine1: z.string().min(1),
      addressLine2: z.string().optional().nullable(),
      city: z.string().min(1),
      state: z.string().min(1),
      postcode: z.string().min(1),
      country: z.string().min(1),
      isDefault: z.boolean().optional(),
    });

    const createParsed = CreateAddressSchema.safeParse(await request.json());

    if (!createParsed.success) {
      return NextResponse.json(
        {
          error: "Validation error",
          details: z.treeifyError(createParsed.error),
        },
        { status: 400 },
      );
    }
    const {
      type,
      firstName,
      lastName,
      addressLine1,
      addressLine2,
      city,
      state,
      postcode,
      country,
      isDefault,
    } = createParsed.data;

    // If this address is being set as default, unset all other default addresses of the same type
    if (isDefault) {
      await db
        .update(addresses)
        .set({ isDefault: false })
        .where(and(eq(addresses.userId, user.id), eq(addresses.type, type)));
    }

    // Create the new address
    const [newAddress] = await db
      .insert(addresses)
      .values({
        userId: user.id,
        type,
        firstName,
        lastName,
        addressLine1,
        addressLine2: addressLine2 ?? null,
        city,
        state,
        postcode,
        country,
        isDefault: isDefault ?? false,
      })
      .returning();

    return NextResponse.json({ address: newAddress }, { status: 201 });
  } catch (error) {
    console.error("Create address error:", error);
    return NextResponse.json(
      { error: "Failed to create address" },
      { status: 500 },
    );
  }
}

// PUT /api/addresses - Update an existing address
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as SessionUser;
    const UpdateAddressSchema = z.object({
      id: z.number().int().positive(),
      type: z.enum(["shipping", "billing"]).optional(),
      firstName: z.string().min(1).optional(),
      lastName: z.string().min(1).optional(),
      addressLine1: z.string().min(1).optional(),
      addressLine2: z.string().optional().nullable(),
      city: z.string().min(1).optional(),
      state: z.string().min(1).optional(),
      postcode: z.string().min(1).optional(),
      country: z.string().min(1).optional(),
      isDefault: z.boolean().optional(),
    });
    const updateParsed = UpdateAddressSchema.safeParse(await request.json());

    if (!updateParsed.success) {
      return NextResponse.json(
        {
          error: "Validation error",
          details: z.treeifyError(updateParsed.error),
        },
        { status: 400 },
      );
    }
    const {
      id,
      type,
      firstName,
      lastName,
      addressLine1,
      addressLine2,
      city,
      state,
      postcode,
      country,
      isDefault,
    } = updateParsed.data;

    // Validate that the address belongs to the user
    const existingAddress = await db
      .select()
      .from(addresses)
      .where(and(eq(addresses.id, id), eq(addresses.userId, user.id)))
      .limit(1);

    if (!existingAddress.length) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    // Validate address type if provided
    if (type && type !== "shipping" && type !== "billing") {
      return NextResponse.json(
        { error: "Invalid address type. Must be 'shipping' or 'billing'" },
        { status: 400 },
      );
    }

    // If this address is being set as default, unset all other default addresses of the same type
    if (isDefault) {
      const addressType = type ?? existingAddress[0].type;
      await db
        .update(addresses)
        .set({ isDefault: false })
        .where(
          and(eq(addresses.userId, user.id), eq(addresses.type, addressType)),
        );
    }

    // Update the address
    const [updatedAddress] = await db
      .update(addresses)
      .set({
        ...(type && { type }),
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(addressLine1 && { addressLine1 }),
        ...(addressLine2 !== undefined && { addressLine2 }),
        ...(city && { city }),
        ...(state && { state }),
        ...(postcode && { postcode }),
        ...(country && { country }),
        ...(isDefault !== undefined && { isDefault }),
      })
      .where(and(eq(addresses.id, id), eq(addresses.userId, user.id)))
      .returning();

    return NextResponse.json({ address: updatedAddress });
  } catch (error) {
    console.error("Update address error:", error);
    return NextResponse.json(
      { error: "Failed to update address" },
      { status: 500 },
    );
  }
}

// DELETE /api/addresses - Delete an address
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as SessionUser;
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    // Get the address to check if it's default
    const [addressToDelete] = await db
      .select()
      .from(addresses)
      .where(and(eq(addresses.id, id), eq(addresses.userId, user.id)))
      .limit(1);

    if (!addressToDelete) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    // Delete the address
    await db
      .delete(addresses)
      .where(and(eq(addresses.id, id), eq(addresses.userId, user.id)));

    // If the deleted address was default, set another address of the same type as default
    if (addressToDelete.isDefault) {
      const [nextAddress] = await db
        .select()
        .from(addresses)
        .where(
          and(
            eq(addresses.userId, user.id),
            eq(addresses.type, addressToDelete.type),
          ),
        )
        .limit(1);

      if (nextAddress) {
        await db
          .update(addresses)
          .set({ isDefault: true })
          .where(eq(addresses.id, nextAddress.id));
      }
    }

    return NextResponse.json({
      success: true,
      message: "Address deleted successfully",
    });
  } catch (error) {
    console.error("Delete address error:", error);
    return NextResponse.json(
      { error: "Failed to delete address" },
      { status: 500 },
    );
  }
}
