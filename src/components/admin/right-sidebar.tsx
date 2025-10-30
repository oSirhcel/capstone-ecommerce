"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useRightSidebar } from "@/contexts/right-sidebar-context";
import { ChatbotHeader } from "@/components/ai-assistant/chatbot-header";
import { ChatbotBody } from "@/components/ai-assistant/chatbot-body";
import { ChatInput } from "@/components/ai-assistant/chat-input";
import { ChatMessage } from "@/components/ai-assistant/chat-message";
import { TypingIndicator } from "@/components/ai-assistant/typing-indicator";
import { SuggestionChips } from "@/components/ai-assistant/suggestion-chips";
import { ProductDraftCard } from "@/components/ai-assistant/product-draft-card";
import { FieldUpdateCard } from "@/components/ai-assistant/field-update-card";
import { OnboardingStatusCard } from "@/components/ai-assistant/onboarding-status-card";
import { useAIProductDraft } from "@/contexts/ai-product-draft-context";
import { useAIFormFields } from "@/contexts/ai-form-fields-context";
import { useChatMutation } from "@/hooks/ai-assistant/use-chat-mutation";
import { useMessages } from "@/hooks/ai-assistant/use-messages";
import { useOnboardingStatus } from "@/hooks/onboarding/use-onboarding-status";
import type { SuggestionChip } from "@/lib/ai/suggestions-generator";
import type { ExtractedProduct } from "@/lib/ai/extractors/product-extractor";
import type { FieldUpdate as ExtractedFieldUpdate } from "@/lib/ai/extractors/field-update-extractor";
import { BotIcon } from "lucide-react";

interface FieldUpdate {
  fieldName: string;
  value: unknown;
}

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

export function AdminRightSidebar() {
  const { isOpen } = useRightSidebar();
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

  const { messages, addMessage, clearHistory, createMessage } = useMessages();
  const chatMutation = useChatMutation();
  const { setPendingDraft } = useAIProductDraft();
  const { setPendingFieldUpdates: setFormPendingUpdates } = useAIFormFields();
  const { data: onboardingStatus, isLoading: isLoadingOnboarding } =
    useOnboardingStatus();

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
      const userMessage = createMessage.user(content);
      addMessage(userMessage);
      setSuggestions([]);
      setCurrentDraft(null);
      setPendingFieldUpdates([]);

      try {
        const response = await chatMutation.mutateAsync({
          messages: [...messages, userMessage],
          pathname,
        });

        const assistantMessage = createMessage.assistant(response.message);
        addMessage(assistantMessage);

        if (response.toolCalls && response.toolCalls.length > 0) {
          for (const toolCall of response.toolCalls) {
            const toolResult = toolCall.result as {
              success: boolean;
              message: string;
              data?: unknown;
            };

            if (toolCall.toolName === "navigate_to_page" && toolResult.data) {
              const navData = toolResult.data as { page: string };
              const pageLabel = formatPageLabel(navData.page);
              setPendingNavigation({
                page: navData.page,
                label: pageLabel,
              });
            }

            if (
              toolCall.toolName === "create_product_draft" &&
              toolResult.data
            ) {
              const draft = toolResult.data as ExtractedProduct;
              setCurrentDraft(draft);
            }

            if (
              toolCall.toolName === "update_product_fields" &&
              toolResult.data
            ) {
              const updateData = toolResult.data as {
                updates: ExtractedFieldUpdate[];
                reasoning?: string;
              };
              if (updateData.updates && updateData.updates.length > 0) {
                const mappedUpdates = updateData.updates.map((update) => ({
                  fieldName: update.fieldName,
                  value: update.value,
                }));
                setPendingFieldUpdates(mappedUpdates);
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

  if (!isOpen) {
    return null;
  }

  return (
    <aside className="bg-sidebar text-sidebar-foreground flex h-[calc(100vh-72px)] w-1/4 flex-col border-l">
      <ChatbotHeader onReset={handleCloseChat} />
      <ChatbotBody>
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-4 py-8">
            <BotIcon className="size-16" />
            <p className="text-center font-semibold">
              Hi! How can I help you today?
            </p>
            <p className="text-muted-foreground pb-2 text-center text-sm">
              I can help you with product management, customer support, and
              store optimization.
            </p>
            {!isLoadingOnboarding &&
              onboardingStatus &&
              onboardingStatus.progress < 100 && (
                <div className="w-full max-w-sm">
                  <OnboardingStatusCard data={onboardingStatus} />
                </div>
              )}
          </div>
        ) : (
          <>
            {!isLoadingOnboarding &&
              onboardingStatus &&
              onboardingStatus.progress < 100 && (
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
                    setPendingFieldUpdates([]);
                  }}
                />
              </div>
            )}
            {pendingNavigation && (
              <div className="mb-4 flex flex-col gap-2 px-4">
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
      {suggestions.length > 0 && !chatMutation.isPending && (
        <SuggestionChips
          suggestions={suggestions}
          onSuggestClick={handleSuggestClick}
        />
      )}
      <ChatInput
        onSend={handleSendMessage}
        disabled={chatMutation.isPending}
        placeholder="Ask me anything or describe a product..."
      />
    </aside>
  );
}
