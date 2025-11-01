import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

const generatePolicyRequestSchema = z.object({
  type: z.enum(["shipping", "returns", "privacy", "terms"]),
  parameters: z.record(z.string(), z.unknown()).optional(),
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
    const validationResult = generatePolicyRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          details: validationResult.error.issues,
        },
        { status: 400 },
      );
    }

    const { type, parameters } = validationResult.data;
    const model = google("gemini-2.5-flash");

    const prompts: Record<string, string> = {
      shipping: `Generate a shipping policy for an Australian e-commerce store. Include:
- Processing times
- Shipping methods and costs
- International shipping (if applicable)
- Delivery times
- Order tracking
- Unclaimed packages

${parameters ? `Additional requirements: ${JSON.stringify(parameters)}` : ""}`,

      returns: `Generate a return and refund policy for an Australian e-commerce store. Include:
- Return eligibility and conditions
- Return timeframes (comply with Australian Consumer Law)
- Return process
- Refund methods and timelines
- Exchanges
- Cost of returns

${parameters ? `Additional requirements: ${JSON.stringify(parameters)}` : ""}`,

      privacy: `Generate a privacy policy for an Australian e-commerce store. Include:
- Information collection
- How information is used
- Data security
- Cookies and tracking
- Third-party services
- User rights (under Australian Privacy Act)
- Contact information

${parameters ? `Additional requirements: ${JSON.stringify(parameters)}` : ""}`,

      terms: `Generate terms of service for an Australian e-commerce store. Include:
- Acceptance of terms
- Account registration
- Products and pricing
- Payment terms
- Order processing
- Limitation of liability
- Governing law (Australian jurisdiction)

${parameters ? `Additional requirements: ${JSON.stringify(parameters)}` : ""}`,
    };

    const result = await generateText({
      model,
      prompt: prompts[type],
      temperature: 0.7,
    });

    return NextResponse.json({
      success: true,
      content: result.text,
      type,
    });
  } catch (error) {
    console.error("Error in generate-policy API:", error);
    return NextResponse.json(
      { error: "Failed to generate policy" },
      { status: 500 },
    );
  }
}
