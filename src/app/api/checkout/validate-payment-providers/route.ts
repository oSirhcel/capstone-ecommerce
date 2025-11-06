import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeIds = searchParams.getAll("storeId");

    if (storeIds.length === 0) {
      return NextResponse.json({
        valid: true,
        missingStores: [],
      });
    }

    // For demo purposes: always return valid to allow fallback to default Stripe
    // Stores without payment setup will use the platform Stripe account
    return NextResponse.json({
      valid: true,
      missingStores: [],
    });
  } catch (error) {
    console.error("Error validating payment providers:", error);
    return NextResponse.json(
      { error: "Failed to validate payment providers" },
      { status: 500 },
    );
  }
}
