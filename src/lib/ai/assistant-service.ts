import { generateText, streamText } from "ai";
import { google } from "@ai-sdk/google";
import type { ChatMessage } from "@/types/ai-assistant";
import { chatbotTools } from "@/lib/ai/tools";
import { executeTool } from "@/lib/ai/tool-handlers";
import {
  formatContextForPrompt,
  type EnhancedChatContext,
} from "@/lib/ai/context-builder";

export interface AssistantConfig {
  context?: EnhancedChatContext;
  stream?: boolean;
  storeId?: string;
  userId?: string;
  headers?: Headers;
}

export interface ChatRequest {
  messages: ChatMessage[];
  config?: AssistantConfig;
}

export interface ChatResponse {
  message: string;
  toolCalls?: Array<{
    toolName: string;
    result: unknown;
  }>;
}

/**
 * Generate AI response for chat messages with tool calling
 */
export async function generateChatResponse(
  request: ChatRequest,
): Promise<ChatResponse> {
  const { messages, config } = request;

  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new Error("Google AI API key not configured");
  }

  const model = google("gemini-2.5-flash");
  const systemPrompt = buildSystemPrompt(config?.context);

  // Convert messages to the format expected by the AI SDK
  const conversationHistory = messages.map((msg) => ({
    role: msg.role === "user" ? ("user" as const) : ("assistant" as const),
    content: msg.content,
  }));

  const toolCalls: Array<{ toolName: string; result: unknown }> = [];

  let result = await generateText({
    model,
    system: systemPrompt,
    tools: chatbotTools,
    messages: conversationHistory,
    temperature: 0.7,
    maxOutputTokens: 1024,
  });

  // Process tool calls if any
  while (result.toolCalls && result.toolCalls.length > 0) {
    const toolResultsMap = new Map<
      string,
      { toolName: string; result: unknown }
    >();

    for (const toolCall of result.toolCalls) {
      // Extract arguments from tool call - AI SDK stores parameters in toolCall.input
      const toolCallWithInput = toolCall as unknown as {
        toolName: string;
        input: Record<string, unknown>;
      };

      const args = toolCallWithInput.input ?? {};

      const toolResult = await executeTool(
        toolCall.toolName,
        args,
        config?.storeId,
        config?.headers,
      );

      toolCalls.push({
        toolName: toolCall.toolName,
        result: toolResult,
      });

      toolResultsMap.set(toolCall.toolCallId, {
        toolName: toolCall.toolName,
        result: toolResult,
      });
    }

    // Continue conversation with tool results
    const userMessage = {
      role: "user" as const,
      content: result.toolCalls
        .map((tc) => {
          const toolResultData = toolResultsMap.get(tc.toolCallId);
          const toolName = tc.toolName;
          const toolResult = toolResultData?.result as {
            success?: boolean;
            message?: string;
            data?: unknown;
          };

          // Format tool result in a more readable way for the AI
          if (toolResult?.success === false) {
            const errorMsg =
              typeof toolResult.message === "string"
                ? toolResult.message
                : "Unknown error";
            return `Tool ${toolName} failed: ${errorMsg}`;
          }

          // For data-returning tools, include both the data and the message
          if (toolResult?.data) {
            const msg =
              typeof toolResult.message === "string"
                ? toolResult.message
                : "Success";
            const formatted = `Tool ${toolName} completed: ${msg}. Data: ${JSON.stringify(toolResult.data)}`;
            return formatted;
          }

          // For action tools (like navigate), just include the message
          const msg =
            typeof toolResult?.message === "string"
              ? toolResult.message
              : "Success";
          return `Tool ${toolName} completed: ${msg}`;
        })
        .join("\n"),
    };

    const updatedMessages = [
      ...conversationHistory,
      {
        role: "assistant" as const,
        content: result.text,
      },
      userMessage,
    ];

    result = await generateText({
      model,
      system: systemPrompt,
      tools: chatbotTools,
      messages: updatedMessages,
      temperature: 0.7,
      maxOutputTokens: 1024,
    });
  }

  return {
    message: result.text,
    toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
  };
}

/**
 * Stream AI response for chat messages with tool calling support
 */
export async function streamChatResponse(
  request: ChatRequest,
): Promise<Response> {
  const { messages, config } = request;

  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new Error("Google AI API key not configured");
  }

  const model = google("gemini-2.5-flash");
  const systemPrompt = buildSystemPrompt(config?.context);

  // Convert messages to the format expected by the AI SDK
  const conversationHistory = messages.map((msg) => ({
    role: msg.role === "user" ? ("user" as const) : ("assistant" as const),
    content: msg.content,
  }));

  const result = streamText({
    model,
    system: systemPrompt,
    tools: chatbotTools,
    messages: conversationHistory,
    temperature: 0.7,
    maxOutputTokens: 1024,
  });

  return result.toTextStreamResponse();
}

/**
 * Build system prompt for the AI assistant
 */
function buildSystemPrompt(context?: EnhancedChatContext): string {
  const contextInfo = context ? formatContextForPrompt(context) : "";
  const setupStatus = context?.setupStatus;
  const isOnboardingIncomplete = setupStatus && setupStatus.progress < 100;

  let prompt = `You are a helpful AI assistant for an Australian e-commerce platform, helping store owners manage their stores and products.

${contextInfo ? `Current Context:\n${contextInfo}\n` : ""}

You have access to powerful tools to help users:
- Extract product information and create product drafts from descriptions
- Update specific product fields from edit instructions
- Navigate users to relevant admin pages
- Retrieve store statistics and recent orders
- Check store setup progress
- Get product summaries

When a user asks about:
- Creating products: Use create_product_draft tool to extract details from their description
- Editing/modifying product fields: Use update_product_fields tool when user wants to change specific fields (e.g., "change price to $50", "make description more concise", "update the name")
- Navigating: Use navigate_to_page tool to guide them
- Store info: Use get_store_overview or get_setup_status tools
- Product inventory: Use get_products_summary tool
- Orders: Use get_recent_orders tool

`;

  // Add onboarding-specific guidance when incomplete
  if (isOnboardingIncomplete) {
    prompt += `🎯 ONBOARDING PRIORITY MODE (${setupStatus.progress}% complete)\n\n`;
    prompt += `The user is currently setting up their store. Your primary responsibility is to guide them through onboarding:\n\n`;

    prompt += `1. PROACTIVE GUIDANCE:\n`;
    prompt += `   - When appropriate, proactively suggest the next incomplete step\n`;
    prompt += `   - Explain why each step is important\n`;
    prompt += `   - Use navigate_to_page tool to guide users to relevant settings pages\n`;
    prompt += `   - Provide step-specific help when asked\n\n`;

    prompt += `2. STEP-SPECIFIC GUIDANCE:\n`;

    if (setupStatus.nextSteps.includes("storeDetails")) {
      prompt += `   - Store Details: Help them add a compelling description that explains what they sell and why customers should shop with them. Improve SEO.\n`;
    }

    if (setupStatus.nextSteps.includes("taxConfigured")) {
      prompt += `   - Tax Settings: Guide GST registration setup. Explain that GST is required for Australian businesses earning over $75k/year.\n`;
    }

    if (setupStatus.nextSteps.includes("shippingConfigured")) {
      prompt += `   - Shipping: Help set up shipping methods (standard, express, etc.) and rates. Essential for order fulfillment.\n`;
    }

    if (setupStatus.nextSteps.includes("paymentConfigured")) {
      prompt += `   - Payments: Guide Stripe connection process. Explain it's required to accept payments. Walk through setup steps.\n`;
    }

    if (setupStatus.nextSteps.includes("policiesCreated")) {
      prompt += `   - Policies: Help create shipping, return, privacy, and terms policies. Offer to help draft them or provide templates.\n`;
    }

    if (setupStatus.nextSteps.includes("firstProductAdded")) {
      prompt += `   - First Product: Help create their first product. Guide through images, descriptions, pricing, and inventory.\n`;
    }

    prompt += `\n3. CELEBRATION & PROGRESS:\n`;
    prompt += `   - When users complete steps, celebrate their progress!\n`;
    prompt += `   - Acknowledge milestones (e.g., "Great progress! You're halfway there!")\n`;
    prompt += `   - Recognize completion: "Congratulations! Your store setup is complete!" when at 100%\n`;
    prompt += `   - Maintain enthusiasm and encouragement\n\n`;

    prompt += `4. CONTEXTUAL HELP:\n`;
    prompt += `   - If user asks general questions during onboarding, briefly answer but redirect to setup when appropriate\n`;
    prompt += `   - Prioritize setup completion over other tasks unless explicitly requested\n`;
    prompt += `   - Be patient and thorough in explanations\n\n`;
  }

  prompt += `General guidance:\n`;
  prompt += `- Be concise and actionable\n`;
  prompt += `- Suggest using tools when appropriate\n`;
  prompt += `- Provide clear next steps\n`;
  prompt += `- Explain Australian e-commerce regulations when needed\n`;
  prompt += `- Help with platform feature questions\n`;

  if (isOnboardingIncomplete) {
    prompt += `- Remember: Onboarding completion is a priority - guide users actively\n`;
  }

  prompt += `\nAlways be helpful, professional, and focused on solving the user's problem.`;

  return prompt;
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
