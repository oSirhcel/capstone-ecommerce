import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import type { ChatMessage } from "@/lib/ai/schemas";
import type { EnhancedChatContext } from "@/lib/ai/context-builder";
import { ONBOARDING_STEP_CONFIGS } from "@/lib/ai/onboarding-step-configs";

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
  const isOnboardingIncomplete = setupStatus && setupStatus.progress < 100;

  let storeContext = `Store Context:
- Current page: ${context.currentPage ?? "unknown"}`;

  if (isOnboardingIncomplete) {
    storeContext += `\n- ⚠️ ONBOARDING INCOMPLETE: ${setupStatus.progress}% complete`;
    storeContext += `\n- Next steps: ${setupStatus.nextSteps.slice(0, 3).join(", ")}`;

    if (setupStatus.stepDetails && setupStatus.stepDetails.length > 0) {
      const nextStep = setupStatus.stepDetails[0];
      storeContext += `\n- Priority step: ${nextStep.label} - ${nextStep.guidance}`;
      if (nextStep.route) {
        storeContext += ` (route: ${nextStep.route})`;
      }
    }
  } else if (setupStatus) {
    storeContext += `\n- Setup: Complete (100%)`;
  }

  if (storeStats) {
    storeContext += `\n- Store stats:`;
    if (storeStats.productCount > 0) {
      storeContext += `\n  • ${storeStats.productCount} products`;
    }
    if (storeStats.activeProducts > 0) {
      storeContext += `\n  • ${storeStats.activeProducts} active`;
    }
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

  let prompt = `You are a helpful assistant providing 2-3 concise next-step suggestions for an e-commerce store owner.
Based on the conversation and store context, suggest natural follow-up questions or actions.

${storeContext}`;

  if (isOnboardingIncomplete) {
    prompt += `\n\nPRIORITY: Generate suggestions that prioritize onboarding completion.`;
    prompt += `\n- First suggestion should relate to the next incomplete onboarding step`;
    prompt += `- Make suggestions actionable and specific to the step`;
    prompt += `- Use conversational language that encourages progress`;
    prompt += `\n- Example: "Complete ${setupStatus.stepDetails?.[0]?.label ?? "next step"}" or "Help me set up ${setupStatus.stepDetails?.[0]?.label ?? "next step"}"`;
  }

  prompt += `\n\nGenerate 2-3 contextually relevant suggestions as a JSON array. Consider:
1. Setup progress - if incomplete, prioritize onboarding steps
2. Store activity - if no products, suggest creating one
3. Current page - provide page-specific suggestions
4. Natural conversation flow - relate to what the user just asked

Each suggestion should be:
1. A natural, conversational question or action
2. Relevant to the current context and page
3. Actionable and helpful for store management`;

  if (isOnboardingIncomplete) {
    prompt += `\n4. Prioritize completing onboarding when relevant`;
  }

  prompt += `\n\nReturn ONLY valid JSON array like:
[
  {"label": "Show me my recent orders", "actionType": "chat"},
  {"label": "How do I add a product?", "actionType": "chat"},
  {"label": "Set up shipping", "actionType": "action"}
]`;

  return prompt;
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
  const isOnboardingIncomplete = setup && setup.progress < 100;

  // Prioritize onboarding if incomplete
  if (isOnboardingIncomplete && setup.nextSteps.length > 0) {
    // Map next steps to actionable suggestions
    const nextStepKeys = setup.nextSteps.slice(0, 2);

    nextStepKeys.forEach((stepKey) => {
      const stepConfig = ONBOARDING_STEP_CONFIGS[stepKey];
      if (stepConfig) {
        // Create actionable suggestions based on step
        if (stepConfig.route) {
          // For steps with routes, create navigation/action suggestions
          suggestions.push({
            label: `Complete: ${stepConfig.label}`,
            actionType: "action",
          });
          suggestions.push({
            label: `Help me ${stepConfig.label.toLowerCase()}`,
            actionType: "chat",
          });
        } else {
          // For steps without routes, create chat suggestions
          suggestions.push({
            label: `How do I ${stepConfig.label.toLowerCase()}?`,
            actionType: "chat",
          });
        }
      } else {
        // Fallback for unknown steps
        suggestions.push({
          label: `Complete ${stepKey}`,
          actionType: "action",
        });
      }
    });

    // Add progress context if space allows
    if (suggestions.length < 3 && setup.progress > 0) {
      suggestions.push({
        label: `Show my setup progress (${setup.progress}%)`,
        actionType: "chat",
      });
    }
  }

  // Page-specific suggestions (only if onboarding is complete or if we have space)
  if (!isOnboardingIncomplete || suggestions.length < 2) {
    switch (context.currentPage) {
      case "add-product":
        if (suggestions.length < 3) {
          suggestions.push(
            { label: "How do I add product images?", actionType: "chat" },
            { label: "What's SEO optimization?", actionType: "chat" },
          );
        }
        break;

      case "products":
        if (stats && stats.productCount === 0 && suggestions.length < 3) {
          suggestions.push(
            { label: "Create my first product", actionType: "navigate" },
            { label: "How do I price products?", actionType: "chat" },
          );
        } else if (suggestions.length < 3) {
          suggestions.push(
            { label: "How do I manage inventory?", actionType: "chat" },
            { label: "View product analytics", actionType: "chat" },
          );
        }
        break;

      case "orders":
        if (
          stats?.totalOrders &&
          stats.totalOrders > 0 &&
          suggestions.length < 3
        ) {
          suggestions.push(
            { label: "Show recent orders", actionType: "chat" },
            { label: "How do I process a refund?", actionType: "chat" },
          );
        } else if (suggestions.length < 3) {
          suggestions.push(
            { label: "How do orders work?", actionType: "chat" },
            { label: "View my products", actionType: "navigate" },
          );
        }
        break;

      case "dashboard":
        if (
          !isOnboardingIncomplete &&
          stats &&
          stats.productCount === 0 &&
          suggestions.length < 3
        ) {
          suggestions.push(
            { label: "Create your first product", actionType: "navigate" },
            { label: "How do I manage my store?", actionType: "chat" },
          );
        } else if (!isOnboardingIncomplete && suggestions.length < 3) {
          suggestions.push(
            { label: "View analytics", actionType: "navigate" },
            { label: "Show recent orders", actionType: "chat" },
          );
        }
        break;

      default:
        if (
          !isOnboardingIncomplete &&
          stats &&
          stats.productCount === 0 &&
          suggestions.length < 3
        ) {
          suggestions.push(
            { label: "Create your first product", actionType: "navigate" },
            { label: "What's product SEO?", actionType: "chat" },
          );
        } else if (!isOnboardingIncomplete && suggestions.length < 3) {
          suggestions.push(
            { label: "Show my recent orders", actionType: "chat" },
            { label: "View analytics", actionType: "navigate" },
          );
        }
        if (!isOnboardingIncomplete && suggestions.length < 3) {
          suggestions.push({
            label: "Help me with my store",
            actionType: "chat",
          });
        }
    }
  }

  return suggestions.slice(0, 3);
}
