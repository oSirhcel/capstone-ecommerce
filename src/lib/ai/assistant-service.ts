import { generateText, streamText } from "ai";
import { google } from "@ai-sdk/google";
import type { ChatMessage, ChatMode, ChatContext } from "@/types/ai-assistant";

export interface AssistantConfig {
  mode: ChatMode;
  context?: ChatContext;
  stream?: boolean;
}

export interface ChatRequest {
  messages: ChatMessage[];
  config: AssistantConfig;
}

/**
 * Generate AI response for chat messages
 */
export async function generateChatResponse(
  request: ChatRequest,
): Promise<string> {
  const { messages, config } = request;

  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new Error("Google AI API key not configured");
  }

  const model = google("gemini-2.5-flash");

  // Build system prompt based on mode
  const systemPrompt = buildSystemPrompt(config.mode, config.context);

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
  const { messages, config } = request;

  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new Error("Google AI API key not configured");
  }

  const model = google("gemini-2.5-flash");

  // Build system prompt based on mode
  const systemPrompt = buildSystemPrompt(config.mode, config.context);

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
 * Build system prompt based on chat mode and context
 */
function buildSystemPrompt(mode: ChatMode, context?: ChatContext): string {
  // TODO: Add context to the system prompt
  const basePrompt = `You are a helpful AI assistant for an Australian e-commerce platform. You help store owners manage their stores, products, and settings.`;

  switch (mode) {
    case "onboarding":
      return `${basePrompt}

You are currently helping a store owner with onboarding tasks. Focus on:
- Setting up store details (name, description, ABN)
- Configuring tax settings (GST registration, tax rates)
- Setting up shipping methods
- Connecting payment methods (Stripe)
- Creating store policies (shipping, returns, privacy, terms)
- Creating their first product

Be patient, clear, and guide them step-by-step.`;

    case "product-creation":
      return `${basePrompt}

You are helping create a product from natural language descriptions. When the user describes a product:
- Extract key details: name, description, price, stock quantity
- Suggest appropriate categories
- Generate SEO-friendly slugs
- Identify missing required fields
- Ask clarifying questions when information is ambiguous

Present your response in a helpful, conversational way.`;

    case "form-filling":
      return `${basePrompt}

You are helping the user fill out forms. Provide guidance on:
- What each field means
- What values are expected
- Best practices for each field
- Australian regulations and requirements when relevant

Do not actually fill the form unless explicitly asked.`;

    case "general":
    default:
      return `${basePrompt}

You provide general help with the platform. You can:
- Answer questions about features
- Explain how to use different parts of the admin panel
- Provide troubleshooting guidance
- Suggest best practices for Australian e-commerce

Keep responses concise and actionable.`;
  }
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
  storeId: string,
): Promise<StoreContext | null> {
  // TODO: Implement actual store context fetching
  return null;
}
