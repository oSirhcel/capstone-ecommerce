import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { suggestCategories } from "@/lib/ai/extractors/product-extractor";
import { db } from "@/server/db";
import { categories } from "@/server/db/schema";
import { z } from "zod";
import { env } from "@/env";

const suggestCategoriesRequestSchema = z.object({
  description: z.string().min(1, "Description is required"),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return NextResponse.json(
        { error: "Google AI API key not configured" },
        { status: 500 },
      );
    }

    const body = (await request.json()) as unknown;
    const validationResult = suggestCategoriesRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          details: validationResult.error.issues,
        },
        { status: 400 },
      );
    }

    const { description } = validationResult.data;

    // Fetch available categories
    const availableCategories = await db
      .select({ id: categories.id, name: categories.name })
      .from(categories);

    const suggestedCategoryIds = await suggestCategories(
      description,
      availableCategories,
    );

    return NextResponse.json({
      success: true,
      categoryIds: suggestedCategoryIds,
    });
  } catch (error) {
    console.error("Error in suggest-categories API:", error);
    return NextResponse.json(
      { error: "Failed to suggest categories" },
      { status: 500 },
    );
  }
}
