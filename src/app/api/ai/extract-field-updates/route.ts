import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { extractFieldUpdates } from "@/lib/ai/extractors/field-update-extractor";
import {
  productFieldUpdateRequestSchema,
  productFieldUpdateResponseSchema,
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
    const validationResult = productFieldUpdateRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          details: validationResult.error.issues,
        },
        { status: 400 },
      );
    }

    const { instruction, currentFormData } = validationResult.data;
    const result = await extractFieldUpdates(instruction, currentFormData);

    const responseData = {
      updates: result.updates,
      reasoning: result.reasoning,
    };

    // Validate response against schema
    const validatedResponse =
      productFieldUpdateResponseSchema.parse(responseData);

    return NextResponse.json(validatedResponse);
  } catch (error) {
    console.error("Error in extract-field-updates API:", error);

    const errorResponse = chatErrorResponseSchema.parse({
      error: "Failed to extract field updates",
    });

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
