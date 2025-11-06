import { type NextRequest, NextResponse } from "next/server";
import { validateStoresHaveProviders } from "@/lib/payment-providers";

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

    const validation = await validateStoresHaveProviders(storeIds);

    return NextResponse.json({
      valid: validation.valid,
      missingStores: validation.missingStores,
    });
  } catch (error) {
    console.error("Error validating payment providers:", error);
    return NextResponse.json(
      { error: "Failed to validate payment providers" },
      { status: 500 },
    );
  }
}

