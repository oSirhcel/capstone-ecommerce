import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  generateChatResponse,
  streamChatResponse,
} from "@/lib/ai/assistant-service";
import {
  chatRequestSchema,
  chatResponseWithToolsSchema,
  chatErrorResponseSchema,
} from "@/lib/ai/schemas";
import { buildChatContext, getUserStoreId } from "@/lib/ai/context-builder";
import {
  generateSuggestions,
  type SuggestionChip,
} from "@/lib/ai/suggestions-generator";

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

    const { messages, stream } = validationResult.data;

    // Convert Zod-validated messages to ChatMessage format
    const chatMessages = messages.map((msg) => ({
      ...msg,
      timestamp:
        typeof msg.timestamp === "string"
          ? new Date(msg.timestamp)
          : msg.timestamp,
    }));

    // Build enhanced context
    const headerPathname = request.headers.get("x-pathname");
    let headerStoreId = request.headers.get("x-store-id");

    // If store ID not in headers, fetch from database
    headerStoreId ??= await getUserStoreId(session.user.id);

    const context = await buildChatContext({
      pathname: headerPathname ?? undefined,
      storeId: headerStoreId ?? undefined,
      userId: session.user.id,
    });

    // If streaming is requested, return a streaming response
    if (stream) {
      const streamResponse = await streamChatResponse({
        messages: chatMessages,
        config: {
          context,
          stream: true,
          storeId: headerStoreId ?? undefined,
        },
      });

      return streamResponse;
    }

    // Otherwise, return a regular JSON response with suggestions
    const response = await generateChatResponse({
      messages: chatMessages,
      config: {
        context,
        storeId: headerStoreId ?? undefined,
        userId: session.user.id,
        headers: request.headers,
      },
    });

    // Generate suggestions for next message
    let suggestions: SuggestionChip[] = [];
    try {
      suggestions = await generateSuggestions(chatMessages, context);
    } catch (error) {
      console.error("Error generating suggestions:", error);
      // Suggestions are optional, so continue without them
    }

    const responseData = {
      message: response.message,
      timestamp: new Date().toISOString(),
      toolCalls: response.toolCalls,
      suggestions,
    };

    // Validate response against schema
    const validatedResponse = chatResponseWithToolsSchema.parse(responseData);

    return NextResponse.json(validatedResponse);
  } catch (error) {
    console.error("Error in chat API:", error);

    const errorResponse = chatErrorResponseSchema.parse({
      error: "Failed to generate response",
    });

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
