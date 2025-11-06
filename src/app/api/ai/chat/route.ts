import { type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { google } from "@ai-sdk/google";
import { streamText, convertToModelMessages, stepCountIs } from "ai";
import type { UIMessage } from "ai";
import { buildChatContext, getUserStoreId } from "@/lib/ai/context-builder";
import { createChatbotTools } from "@/lib/ai/tools";
import { buildSystemPrompt } from "@/lib/ai/assistant-service";

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return new Response("Google AI API key not configured", { status: 500 });
    }

    const body = (await request.json()) as {
      messages: UIMessage[];
      pathname?: string;
      storeId?: string;
    };

    if (!body.messages || !Array.isArray(body.messages)) {
      return new Response("Invalid request body", { status: 400 });
    }

    // Get storeId from body or fetch from database
    let storeId = body.storeId;
    storeId ??= (await getUserStoreId(session.user.id)) ?? undefined;

    // Build enhanced context
    const context = await buildChatContext({
      pathname: body.pathname,
      storeId,
      userId: session.user.id,
    });

    const systemPrompt = buildSystemPrompt(context);

    // Convert UIMessages to model messages
    const modelMessages = convertToModelMessages(body.messages);

    // Create tools with storeId context
    const tools = createChatbotTools(storeId);

    // Stream text with tools
    const result = streamText({
      model: google("gemini-2.5-flash"),
      system: systemPrompt,
      messages: modelMessages,
      tools,
      stopWhen: stepCountIs(5),
      temperature: 0.7,
      maxOutputTokens: 1024,
    });

    return result.toUIMessageStreamResponse();
  } catch (error: unknown) {
    console.error("Error in chat API:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to generate response",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
