import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { extractProductData } from "@/lib/ai/extractors/product-extractor";
import { z } from "zod";

const extractProductRequestSchema = z.object({
  description: z.string().min(1, "Description is required"),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return NextResponse.json(
        { error: "Google AI API key not configured" },
        { status: 500 },
      );
    }

    const body = (await request.json()) as unknown;
    const validationResult = extractProductRequestSchema.safeParse(body);

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
    const result = await extractProductData(description);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Failed to extract product data",
          details: result.errors?.issues,
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      warnings: result.warnings,
    });
  } catch (error) {
    console.error("Error in extract-product API:", error);
    return NextResponse.json(
      { error: "Failed to extract product data" },
      { status: 500 },
    );
  }
}
