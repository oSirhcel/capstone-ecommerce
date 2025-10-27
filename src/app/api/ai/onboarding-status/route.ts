import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import { stores, storeSettings, products } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's store
    const userStores = await db
      .select()
      .from(stores)
      .where(eq(stores.ownerId, session.user.id))
      .limit(1);

    if (userStores.length === 0) {
      return NextResponse.json({
        hasStore: false,
        progress: 0,
        completedSteps: [],
        nextSteps: [
          "Create your store",
          "Add store details",
          "Configure tax settings",
          "Set up shipping",
          "Connect payment method",
          "Create store policies",
          "Add your first product",
        ],
      });
    }

    const store = userStores[0];

    // Check store settings
    const settings = await db
      .select()
      .from(storeSettings)
      .where(eq(storeSettings.storeId, store.id))
      .limit(1);

    const hasSettings = settings.length > 0;
    const settingsData = hasSettings ? settings[0] : null;

    // Check product count
    const productCount = await db
      .select({ count: products.id })
      .from(products)
      .where(eq(products.storeId, store.id));

    const hasProducts = productCount.length > 0;

    // Determine completion
    const steps = {
      storeCreated: true,
      storeDetails: !!store.description,
      taxConfigured: hasSettings && !!settingsData?.gstRegistered,
      shippingConfigured: hasSettings && !!settingsData?.shippingPolicy,
      paymentConfigured: false, // TODO: Add payment settings check when implemented
      policiesCreated:
        hasSettings &&
        (!!settingsData?.shippingPolicy ||
          !!settingsData?.returnPolicy ||
          !!settingsData?.privacyPolicy ||
          !!settingsData?.termsOfService),
      firstProductAdded: hasProducts,
    };

    const completedSteps = Object.entries(steps)
      .filter(([, completed]) => completed)
      .map(([step]) => step);

    const allSteps = Object.keys(steps);
    const nextSteps = allSteps.filter(
      (step) => !steps[step as keyof typeof steps],
    );

    const progress = Math.round(
      (completedSteps.length / allSteps.length) * 100,
    );

    return NextResponse.json({
      hasStore: true,
      storeId: store.id,
      progress,
      completedSteps,
      nextSteps,
      details: {
        storeName: store.name,
        storeDescription: store.description,
        hasSettings,
        productCount: productCount.length,
      },
    });
  } catch (error) {
    console.error("Error in onboarding-status API:", error);
    return NextResponse.json(
      { error: "Failed to get onboarding status" },
      { status: 500 },
    );
  }
}
