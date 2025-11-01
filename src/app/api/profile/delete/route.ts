import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import {
  users,
  userProfiles,
  addresses,
  carts,
  cartItems,
  orders,
  orderItems,
  reviews,
  stores,
  storeCustomerProfiles,
  paymentMethods,
  zeroTrustAssessments,
  zeroTrustVerifications,
  riskAssessmentOrderLinks,
  riskAssessmentStoreLinks,
} from "@/server/db/schema";
import { eq, inArray } from "drizzle-orm";
import { z } from "zod";

interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

const DeleteAccountSchema = z.object({
  confirmDelete: z.boolean().refine((val) => val === true, {
    message: "You must confirm account deletion",
  }),
  password: z.string().min(1, "Password is required for account deletion"),
});

// DELETE /api/profile/delete - Delete user account and all associated data
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as SessionUser).id;
    const body = (await request.json()) as z.infer<typeof DeleteAccountSchema>;

    const deleteData = DeleteAccountSchema.parse(body);

    // Get current user data to verify password
    const [user] = await db
      .select({
        id: users.id,
        password: users.password,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify password for account deletion
    const bcrypt = await import("bcryptjs");
    const isPasswordValid = await bcrypt.compare(
      deleteData.password,
      user.password,
    );

    if (!isPasswordValid) {
      return NextResponse.json(
        {
          error:
            "Invalid password. Account deletion requires password confirmation.",
        },
        { status: 400 },
      );
    }

    // Start a transaction to delete all related data
    await db.transaction(async (tx) => {
      // Delete risk assessment related data first (due to foreign key constraints)
      await tx
        .delete(riskAssessmentStoreLinks)
        .where(
          inArray(
            riskAssessmentStoreLinks.riskAssessmentId,
            db
              .select({ id: zeroTrustAssessments.id })
              .from(zeroTrustAssessments)
              .where(eq(zeroTrustAssessments.userId, userId)),
          ),
        );

      await tx
        .delete(riskAssessmentOrderLinks)
        .where(
          inArray(
            riskAssessmentOrderLinks.riskAssessmentId,
            db
              .select({ id: zeroTrustAssessments.id })
              .from(zeroTrustAssessments)
              .where(eq(zeroTrustAssessments.userId, userId)),
          ),
        );

      await tx
        .delete(zeroTrustVerifications)
        .where(eq(zeroTrustVerifications.userId, userId));
      await tx
        .delete(zeroTrustAssessments)
        .where(eq(zeroTrustAssessments.userId, userId));

      // Delete payment methods
      await tx.delete(paymentMethods).where(eq(paymentMethods.userId, userId));

      // Delete store customer profiles
      await tx
        .delete(storeCustomerProfiles)
        .where(eq(storeCustomerProfiles.userId, userId));

      // Delete addresses
      await tx.delete(addresses).where(eq(addresses.userId, userId));

      // Delete cart items first, then cart
      await tx
        .delete(cartItems)
        .where(
          inArray(
            cartItems.cartId,
            db
              .select({ id: carts.id })
              .from(carts)
              .where(eq(carts.userId, userId)),
          ),
        );
      await tx.delete(carts).where(eq(carts.userId, userId));

      // Delete order items first, then orders
      await tx
        .delete(orderItems)
        .where(
          inArray(
            orderItems.orderId,
            db
              .select({ id: orders.id })
              .from(orders)
              .where(eq(orders.userId, userId)),
          ),
        );
      await tx.delete(orders).where(eq(orders.userId, userId));

      // Delete reviews
      await tx.delete(reviews).where(eq(reviews.userId, userId));

      // Delete user profile
      await tx.delete(userProfiles).where(eq(userProfiles.userId, userId));

      // Delete stores owned by user
      await tx.delete(stores).where(eq(stores.ownerId, userId));

      // Finally, delete the user
      await tx.delete(users).where(eq(users.id, userId));
    });

    return NextResponse.json({
      message: "Account and all associated data have been permanently deleted",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation error",
          details: z.treeifyError(error),
        },
        { status: 400 },
      );
    }

    console.error("Error deleting account:", error);
    return NextResponse.json(
      { error: "Failed to delete account. Please try again." },
      { status: 500 },
    );
  }
}
