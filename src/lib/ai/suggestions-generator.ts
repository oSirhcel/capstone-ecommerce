import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import type { ChatMessage } from "@/lib/ai/schemas";
import type { EnhancedChatContext } from "@/lib/ai/context-builder";

export interface SuggestionChip {
  label: string;
  actionType: "chat" | "navigate" | "action";
}

/**
 * Generate contextual suggestions for next user messages
 */
export async function generateSuggestions(
  messages: ChatMessage[],
  context: EnhancedChatContext,
): Promise<SuggestionChip[]> {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return getDefaultSuggestions(context);
  }

  try {
    const model = google("gemini-2.5-flash");

    const conversationHistory = messages
      .slice(-3) // Last 3 messages for context
      .map((msg) => ({
        role: msg.role === "user" ? ("user" as const) : ("assistant" as const),
        content: msg.content,
      }));

    const prompt = buildSuggestionsPrompt(context);

    const result = await generateText({
      model,
      system: prompt,
      messages: conversationHistory,
      temperature: 0.7,
      maxOutputTokens: 300,
    });

    return parseSuggestions(result.text);
  } catch {
    // Fallback to default suggestions on error
    return getDefaultSuggestions(context);
  }
}

/**
 * Build system prompt for suggestion generation
 */
function buildSuggestionsPrompt(context: EnhancedChatContext): string {
  const storeStats = context.storeStats;
  const setupStatus = context.setupStatus;

  let storeContext = `Store Context:
- Current page: ${context.currentPage ?? "unknown"}`;

  if (setupStatus) {
    storeContext += `\n- Setup progress: ${setupStatus.progress}%`;
    if (setupStatus.nextSteps.length > 0) {
      storeContext += `\n- Recommended next steps: ${setupStatus.nextSteps.slice(0, 2).join(", ")}`;
    }
  }

  if (storeStats) {
    storeContext += `\n- Store stats:`;
    storeContext += `\n  • ${storeStats.productCount} products`;
    storeContext += `\n  • ${storeStats.activeProducts} active`;
    if (storeStats.totalOrders !== undefined) {
      storeContext += `\n  • ${storeStats.totalOrders} orders`;
    }
    if (storeStats.revenue) {
      storeContext += `\n  • $${storeStats.revenue} revenue`;
    }
    if (storeStats.activeCustomers !== undefined) {
      storeContext += `\n  • ${storeStats.activeCustomers} active customers`;
    }
  }

  return `You are a helpful assistant providing 2-3 concise next-step suggestions for an e-commerce store owner.
Based on the conversation and store context, suggest natural follow-up questions or actions.

${storeContext}

Generate 2-3 contextually relevant suggestions as a JSON array. Consider:
1. Setup progress - if incomplete, suggest setup steps
2. Store activity - if no products, suggest creating one
3. Current page - provide page-specific suggestions
4. Natural conversation flow - relate to what the user just asked

Each suggestion should be:
1. A natural, conversational question or action
2. Relevant to the current context and page
3. Actionable and helpful for store management

Return ONLY valid JSON array like:
[
  {"label": "Show me my recent orders", "actionType": "chat"},
  {"label": "How do I add a product?", "actionType": "chat"},
  {"label": "Set up shipping", "actionType": "action"}
]`;
}

/**
 * Parse suggestions from AI response
 */
function parseSuggestions(text: string): SuggestionChip[] {
  try {
    const regex = /\[[\s\S]*\]/;
    const jsonMatch = regex.exec(text);
    if (!jsonMatch) return getDefaultSuggestions({});

    const suggestions = JSON.parse(jsonMatch[0]) as unknown;
    if (
      Array.isArray(suggestions) &&
      suggestions.every(
        (s) =>
          typeof s === "object" &&
          s !== null &&
          "label" in s &&
          typeof (s as Record<string, unknown>).label === "string" &&
          "actionType" in s,
      )
    ) {
      return suggestions as SuggestionChip[];
    }
    return getDefaultSuggestions({});
  } catch {
    return getDefaultSuggestions({});
  }
}

/**
 * Get default context-aware suggestions
 */
function getDefaultSuggestions(
  context: Partial<EnhancedChatContext>,
): SuggestionChip[] {
  const suggestions: SuggestionChip[] = [];
  const stats = context.storeStats;
  const setup = context.setupStatus;

  // Setup-first suggestions if incomplete
  if (setup && setup.progress < 100) {
    const nextStep = setup.nextSteps?.[0];
    if (nextStep) {
      suggestions.push({
        label: `${nextStep} (${setup.progress}% done)`,
        actionType: "action",
      });
    }
  }

  // Page-specific suggestions
  switch (context.currentPage) {
    case "add-product":
      suggestions.push(
        { label: "How do I add product images?", actionType: "chat" },
        { label: "What's SEO optimization?", actionType: "chat" },
        { label: "View my products", actionType: "navigate" },
      );
      break;

    case "products":
      if (stats && stats.productCount === 0) {
        suggestions.push(
          { label: "Create my first product", actionType: "navigate" },
          { label: "How do I price products?", actionType: "chat" },
        );
      } else {
        suggestions.push(
          { label: "How do I manage inventory?", actionType: "chat" },
          { label: "View product analytics", actionType: "chat" },
        );
      }
      suggestions.push({ label: "View orders", actionType: "navigate" });
      break;

    case "orders":
      if (stats?.totalOrders && stats.totalOrders > 0) {
        suggestions.push(
          { label: "Show recent orders", actionType: "chat" },
          { label: "How do I process a refund?", actionType: "chat" },
        );
      } else {
        suggestions.push(
          { label: "How do orders work?", actionType: "chat" },
          { label: "View my products", actionType: "navigate" },
        );
      }
      suggestions.push({ label: "View customer details", actionType: "chat" });
      break;

    case "dashboard":
      if (setup && setup.progress < 100) {
        suggestions.push(
          { label: "What's the next setup step?", actionType: "chat" },
          { label: "View my products", actionType: "navigate" },
        );
      } else if (stats && stats.productCount === 0) {
        suggestions.push(
          { label: "Create your first product", actionType: "navigate" },
          { label: "How do I manage my store?", actionType: "chat" },
        );
      } else {
        suggestions.push(
          { label: "View analytics", actionType: "navigate" },
          { label: "Show recent orders", actionType: "chat" },
        );
      }
      break;

    default:
      if (stats && stats.productCount === 0) {
        suggestions.push(
          { label: "Create your first product", actionType: "navigate" },
          { label: "What's product SEO?", actionType: "chat" },
        );
      } else {
        suggestions.push(
          { label: "Show my recent orders", actionType: "chat" },
          { label: "View analytics", actionType: "navigate" },
        );
      }
      suggestions.push({ label: "Help me with my store", actionType: "chat" });
  }

  return suggestions.slice(0, 3);
}
