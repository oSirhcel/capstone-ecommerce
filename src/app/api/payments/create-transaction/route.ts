import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import { paymentTransactions } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import type { CreateTransactionRequest } from "@/types/api-responses";

// POST /api/payments/create-transaction - Create payment transaction record
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as CreateTransactionRequest;
    const { paymentIntentId, orderId, amount, currency } = body;

    if (!paymentIntentId || !orderId || !amount) {
      return NextResponse.json(
        { error: "Payment intent ID, order ID, and amount are required" },
        { status: 400 },
      );
    }

    // Check if transaction record already exists
    const existingTransaction = await db
      .select()
      .from(paymentTransactions)
      .where(eq(paymentTransactions.transactionId, paymentIntentId))
      .limit(1);

    if (existingTransaction.length > 0) {
      // Update existing record with orderId if it was missing
      if (!existingTransaction[0].orderId) {
        await db
          .update(paymentTransactions)
          .set({
            orderId: orderId,
            updatedAt: new Date(),
          })
          .where(eq(paymentTransactions.transactionId, paymentIntentId));
      }
      return NextResponse.json({
        success: true,
        message: "Payment transaction record already exists",
      });
    }

    // Create the payment transaction record
    await db.insert(paymentTransactions).values({
      orderId: orderId,
      amount: Math.round(amount * 100), // Convert dollars to cents for database storage
      currency: currency ?? "aud",
      status: "completed", // Payment is already processed at this point
      transactionId: paymentIntentId,
      gatewayResponse: JSON.stringify({
        paymentIntentId: paymentIntentId,
        status: "succeeded",
        amount: amount, // Keep original amount in gateway response for reference
        currency: currency ?? "aud",
      }),
    });

    return NextResponse.json({
      success: true,
      message: "Payment transaction record created",
    });
  } catch (error) {
    console.error("Payment transaction creation error:", error);
    return NextResponse.json(
      { error: "Failed to create payment transaction" },
      { status: 500 },
    );
  }
}
