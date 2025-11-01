import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { extractProductData } from "@/lib/ai/extractors/product-extractor";
import {
  productExtractionRequestSchema,
  productExtractionResponseSchema,
  chatErrorResponseSchema,
} from "@/lib/ai/schemas";

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
    const validationResult = productExtractionRequestSchema.safeParse(body);

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

    const responseData = {
      success: true,
      data: result.data,
    };

    // Validate response against schema
    const validatedResponse =
      productExtractionResponseSchema.parse(responseData);

    return NextResponse.json(validatedResponse);
  } catch (error) {
    console.error("Error in extract-product API:", error);

    const errorResponse = chatErrorResponseSchema.parse({
      error: "Failed to extract product data",
    });

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
