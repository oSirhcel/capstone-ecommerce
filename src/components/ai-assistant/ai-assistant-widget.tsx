"use client";

import { useState, useCallback } from "react";
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
import { useAIProductDraft } from "@/contexts/ai-product-draft-context";
import { useChatMutation } from "@/hooks/ai-assistant/use-chat-mutation";
import { useMessages } from "@/hooks/ai-assistant/use-messages";
import { usePathname } from "next/navigation";
import type { SuggestionChip } from "@/lib/ai/suggestions-generator";
import type { ExtractedProduct } from "@/lib/ai/extractors/product-extractor";

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

export function AIAssistantWidget() {
  const router = useRouter();
  const pathname = usePathname();
  const [suggestions, setSuggestions] = useState<SuggestionChip[]>([]);
  const [currentDraft, setCurrentDraft] = useState<ExtractedProduct | null>(
    null,
  );
  const [pendingNavigation, setPendingNavigation] = useState<{
    page: string;
    label: string;
  } | null>(null);

  // Use hooks
  const { messages, addMessage, clearHistory, createMessage } = useMessages();
  const chatMutation = useChatMutation();
  const { setPendingDraft } = useAIProductDraft();

  // Close chat and reset to initial state
  const handleCloseChat = useCallback(() => {
    clearHistory();
    setSuggestions([]);
    setCurrentDraft(null);
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
    [messages, chatMutation, addMessage, createMessage, pathname],
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
            <div className="text-muted-foreground flex h-full items-center justify-center">
              <p>Welcome! How can I help you today?</p>
            </div>
          ) : (
            <>
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
