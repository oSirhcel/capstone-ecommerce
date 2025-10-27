import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  generateChatResponse,
  streamChatResponse,
} from "@/lib/ai/assistant-service";
import { z } from "zod";

const chatRequestSchema = z.object({
  messages: z.array(
    z.object({
      id: z.string(),
      role: z.enum(["user", "assistant", "system"]),
      content: z.string(),
      timestamp: z.union([z.string(), z.date()]),
      type: z.enum(["text", "action", "form-fill", "suggestion"]).optional(),
      metadata: z.record(z.string(), z.unknown()).optional(),
    }),
  ),
  mode: z.enum(["general", "onboarding", "product-creation", "form-filling"]),
  stream: z.boolean().optional(),
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

    // Validate request body with Zod
    const validationResult = chatRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          details: validationResult.error.issues,
        },
        { status: 400 },
      );
    }

    const { messages, mode, stream } = validationResult.data;

    // Convert Zod-validated messages to ChatMessage format
    const chatMessages = messages.map((msg) => ({
      ...msg,
      timestamp:
        typeof msg.timestamp === "string"
          ? new Date(msg.timestamp)
          : msg.timestamp,
    }));

    // If streaming is requested, return a streaming response
    if (stream) {
      const streamResponse = await streamChatResponse({
        messages: chatMessages,
        config: { mode, stream: true },
      });

      return streamResponse;
    }

    // Otherwise, return a regular JSON response
    const response = await generateChatResponse({
      messages: chatMessages,
      config: { mode },
    });

    return NextResponse.json({
      message: response,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in chat API:", error);
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 },
    );
  }
}
