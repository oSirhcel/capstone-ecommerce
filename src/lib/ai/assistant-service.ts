import { generateText, streamText } from "ai";
import { google } from "@ai-sdk/google";
import type { ChatMessage } from "@/types/ai-assistant";

export interface AssistantConfig {
  context?: unknown;
  stream?: boolean;
}

export interface ChatRequest {
  messages: ChatMessage[];
  config?: AssistantConfig;
}

/**
 * Generate AI response for chat messages
 */
export async function generateChatResponse(
  request: ChatRequest,
): Promise<string> {
  const { messages } = request;

  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new Error("Google AI API key not configured");
  }

  const model = google("gemini-2.5-flash");

  // Build system prompt
  const systemPrompt = buildSystemPrompt();

  // Convert messages to the format expected by the AI SDK
  const conversationHistory = messages.map((msg) => ({
    role: msg.role === "user" ? ("user" as const) : ("assistant" as const),
    content: msg.content,
  }));

  const result = await generateText({
    model,
    system: systemPrompt,
    messages: conversationHistory,
    temperature: 0.7,
  });

  return result.text;
}

/**
 * Stream AI response for chat messages
 */
export async function streamChatResponse(
  request: ChatRequest,
): Promise<Response> {
  const { messages } = request;

  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new Error("Google AI API key not configured");
  }

  const model = google("gemini-2.5-flash");

  // Build system prompt
  const systemPrompt = buildSystemPrompt();

  // Convert messages to the format expected by the AI SDK
  const conversationHistory = messages.map((msg) => ({
    role: msg.role === "user" ? ("user" as const) : ("assistant" as const),
    content: msg.content,
  }));

  const result = streamText({
    model,
    system: systemPrompt,
    messages: conversationHistory,
    temperature: 0.7,
  });

  return result.toTextStreamResponse();
}

/**
 * Build system prompt for the AI assistant
 */
function buildSystemPrompt(): string {
  return `You are a helpful AI assistant for an Australian e-commerce platform. You help store owners manage their stores, products, and settings.

You are versatile and can help with:
- Creating products from natural language descriptions. Extract key details: name, description, price, stock quantity, suggest categories, generate SEO-friendly content
- Answering questions about platform features and usage
- Providing guidance on form fields and best practices
- Explaining Australian e-commerce regulations and requirements
- General troubleshooting and platform support

When users describe products, be ready to extract and structure the data. When they ask questions, provide clear, concise, actionable answers. Keep responses helpful and focused on solving their problems.`;
}

/**
 * Get store context for AI assistant
 */
export interface StoreContext {
  storeId: string;
  storeName: string;
  productCount: number;
  hasShippingConfigured: boolean;
  hasPaymentConfigured: boolean;
  hasPoliciesConfigured: boolean;
}

export async function getStoreContext(
  _storeId: string,
): Promise<StoreContext | null> {
  // TODO: Implement actual store context fetching
  return null;
}
