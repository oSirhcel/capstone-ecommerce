"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChatbotButton } from "./chatbot-button";
import { ChatbotWindow } from "./chatbot-window";
import { ChatbotHeader } from "./chatbot-header";
import { ChatbotBody } from "./chatbot-body";
import { ChatInput } from "./chat-input";
import { ChatMessage } from "./chat-message";
import { TypingIndicator } from "./typing-indicator";
import { SuggestionChips } from "./suggestion-chips";
import { ProductDraftCard } from "./product-draft-card";
import { FieldUpdateCard } from "./field-update-card";
import { OnboardingStatusCard } from "./onboarding-status-card";
import { useAIProductDraft } from "@/contexts/ai-product-draft-context";
import { useAIFormFields } from "@/contexts/ai-form-fields-context";
import { useChatMutation } from "@/hooks/ai-assistant/use-chat-mutation";
import { useMessages } from "@/hooks/ai-assistant/use-messages";
import { usePathname } from "next/navigation";
import { useOnboardingStatus } from "@/hooks/onboarding/use-onboarding-status";
import type { SuggestionChip } from "@/lib/ai/suggestions-generator";
import type { ExtractedProduct } from "@/lib/ai/extractors/product-extractor";
import type { FieldUpdate as ExtractedFieldUpdate } from "@/lib/ai/extractors/field-update-extractor";

interface FieldUpdate {
  fieldName: string;
  value: unknown;
}

/**
 * Format page path to user-friendly label
 */
function formatPageLabel(page: string): string {
  const pageMap: Record<string, string> = {
    "/admin/dashboard": "Dashboard",
    "/admin/products": "Products",
    "/admin/products/add": "Add Product",
    "/admin/orders": "Orders",
    "/admin/customers": "Customers",
    "/admin/analytics": "Analytics",
    "/admin/settings/store": "Store Settings",
    "/admin/settings/shipping": "Shipping Settings",
    "/admin/settings/payments": "Payment Settings",
    "/admin/settings/tax": "Tax Settings",
  };
  return pageMap[page] ?? page;
}

/**
 * Get contextual welcome message based on onboarding progress
 */
function getWelcomeMessage(progress: number, hasStore: boolean): string {
  if (!hasStore || progress < 20) {
    return "Welcome! Let's set up your store. I'll guide you through each step.";
  }
  if (progress < 50) {
    return `Great start! You're ${progress}% done. Want help with the next step?`;
  }
  if (progress < 80) {
    return `Excellent progress! You're ${progress}% complete. Almost there!`;
  }
  if (progress < 100) {
    return `Almost there! Just a few more steps to complete your store setup.`;
  }
  return "Welcome! How can I help you today?";
}

export function AIAssistantWidget() {
  const router = useRouter();
  const pathname = usePathname();
  const [suggestions, setSuggestions] = useState<SuggestionChip[]>([]);
  const [currentDraft, setCurrentDraft] = useState<ExtractedProduct | null>(
    null,
  );
  const [pendingFieldUpdates, setPendingFieldUpdates] = useState<FieldUpdate[]>(
    [],
  );
  const [pendingNavigation, setPendingNavigation] = useState<{
    page: string;
    label: string;
  } | null>(null);
  const [welcomeMessage, setWelcomeMessage] = useState<string>(
    "Welcome! How can I help you today?",
  );

  // Use hooks
  const { messages, addMessage, clearHistory, createMessage } = useMessages();
  const chatMutation = useChatMutation();
  const { setPendingDraft } = useAIProductDraft();
  const { setPendingFieldUpdates: setFormPendingUpdates } = useAIFormFields();
  const { data: onboardingStatus, isLoading: isLoadingOnboarding } = useOnboardingStatus();

  // Update welcome message based on onboarding status
  useEffect(() => {
    if (onboardingStatus) {
      const message = getWelcomeMessage(
        onboardingStatus.progress,
        onboardingStatus.hasStore,
      );
      setWelcomeMessage(message);
    }
  }, [onboardingStatus]);

  // Close chat and reset to initial state
  const handleCloseChat = useCallback(() => {
    clearHistory();
    setSuggestions([]);
    setCurrentDraft(null);
    setPendingFieldUpdates([]);
    setPendingNavigation(null);
  }, [clearHistory]);

  const handleApplyDraft = useCallback(
    (draft: ExtractedProduct) => {
      setPendingDraft(draft);
      setTimeout(() => router.push("/admin/products/add"), 500);
      setCurrentDraft(null);
    },
    [setPendingDraft, router],
  );

  const handleNavigate = useCallback(
    (page: string) => {
      setPendingNavigation(null);
      router.push(page);
    },
    [router],
  );

  const handleSendMessage = useCallback(
    async (content: string) => {
      // Add user message
      const userMessage = createMessage.user(content);
      addMessage(userMessage);
      setSuggestions([]);
      setCurrentDraft(null);
      setPendingFieldUpdates([]);

      try {
        // Send to AI with context headers
        const response = await chatMutation.mutateAsync({
          messages: [...messages, userMessage],
          pathname,
        });

        // Add assistant response
        const assistantMessage = createMessage.assistant(response.message);
        addMessage(assistantMessage);

        // Handle tool calls if any
        if (response.toolCalls && response.toolCalls.length > 0) {
          for (const toolCall of response.toolCalls) {
            const toolResult = toolCall.result as {
              success: boolean;
              message: string;
              data?: unknown;
            };

            // Handle navigation tool
            if (toolCall.toolName === "navigate_to_page" && toolResult.data) {
              const navData = toolResult.data as { page: string };
              const pageLabel = formatPageLabel(navData.page);
              setPendingNavigation({
                page: navData.page,
                label: pageLabel,
              });
            }

            // Handle product draft creation
            if (
              toolCall.toolName === "create_product_draft" &&
              toolResult.data
            ) {
              const draft = toolResult.data as ExtractedProduct;
              setCurrentDraft(draft);
            }

            // Handle field updates
            if (
              toolCall.toolName === "update_product_fields" &&
              toolResult.data
            ) {
              const updateData = toolResult.data as {
                updates: ExtractedFieldUpdate[];
                reasoning?: string;
              };
              if (updateData.updates && updateData.updates.length > 0) {
                // Map to format expected by FieldUpdateCard (fieldName, value)
                const mappedUpdates = updateData.updates.map((update) => ({
                  fieldName: update.fieldName,
                  value: update.value,
                }));
                setPendingFieldUpdates(mappedUpdates);
                // Also set in form context for form integration
                const updatesMap = updateData.updates.reduce(
                  (acc, update) => {
                    acc[update.fieldName] = update.value;
                    return acc;
                  },
                  {} as Record<string, unknown>,
                );
                setFormPendingUpdates(updatesMap);
              }
            }
          }
        }

        // Set suggestions from response
        if (response.suggestions && response.suggestions.length > 0) {
          setSuggestions(response.suggestions);
        }
      } catch (error) {
        console.error("Error sending message:", error);
        const errorMessage = createMessage.error();
        addMessage(errorMessage);
      }
    },
    [
      messages,
      chatMutation,
      addMessage,
      createMessage,
      pathname,
      setFormPendingUpdates,
    ],
  );

  const handleSuggestClick = useCallback(
    (label: string) => {
      void handleSendMessage(label);
    },
    [handleSendMessage],
  );

  return (
    <>
      <ChatbotButton />
      <ChatbotWindow>
        <ChatbotHeader onReset={handleCloseChat} />
        <ChatbotBody>
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 px-4 py-8">
              <p className="text-muted-foreground text-center">{welcomeMessage}</p>
              {!isLoadingOnboarding && onboardingStatus && onboardingStatus.progress < 100 && (
                <div className="w-full max-w-sm">
                  <OnboardingStatusCard data={onboardingStatus} />
                </div>
              )}
            </div>
          ) : (
            <>
              {!isLoadingOnboarding && onboardingStatus && onboardingStatus.progress < 100 && (
                <div className="mb-4 px-4 pt-4">
                  <OnboardingStatusCard data={onboardingStatus} />
                </div>
              )}
              {messages.map((message) => (
                <div key={message.id}>
                  <ChatMessage message={message} />
                </div>
              ))}
              {currentDraft && (
                <ProductDraftCard
                  draft={currentDraft}
                  onApply={handleApplyDraft}
                />
              )}
              {pendingFieldUpdates.length > 0 && (
                <div className="mb-4 px-4">
                  <FieldUpdateCard
                    updates={pendingFieldUpdates}
                    onApply={() => {
                      // Field updates are already set in form context
                      // The form will apply them automatically
                      setPendingFieldUpdates([]);
                    }}
                  />
                </div>
              )}
              {pendingNavigation && (
                <div className="mb-4 flex flex-col gap-2">
                  <p className="text-muted-foreground text-sm">
                    Click to navigate:
                  </p>
                  <button
                    onClick={() => handleNavigate(pendingNavigation.page)}
                    className="w-full rounded-lg bg-blue-50 px-4 py-2 text-left text-sm font-medium text-blue-600 transition-colors hover:bg-blue-100"
                  >
                    → {pendingNavigation.label}
                  </button>
                </div>
              )}
              {chatMutation.isPending && <TypingIndicator />}
            </>
          )}
        </ChatbotBody>
        <ChatInput
          onSend={handleSendMessage}
          disabled={chatMutation.isPending}
          placeholder="Ask me anything or describe a product..."
        />
        {suggestions.length > 0 && !chatMutation.isPending && (
          <SuggestionChips
            suggestions={suggestions}
            onSuggestClick={handleSuggestClick}
          />
        )}
      </ChatbotWindow>
    </>
  );
}
