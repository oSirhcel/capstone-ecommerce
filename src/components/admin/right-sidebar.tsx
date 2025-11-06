"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useRightSidebar } from "@/contexts/right-sidebar-context";
import { ChatbotHeader } from "@/components/ai-assistant/chatbot-header";
import { ChatbotBody } from "@/components/ai-assistant/chatbot-body";
import { ChatInput } from "@/components/ai-assistant/chat-input";
import { ChatMessage } from "@/components/ai-assistant/chat-message";
import { TypingIndicator } from "@/components/ai-assistant/typing-indicator";
import { ProductDraftCard } from "@/components/ai-assistant/product-draft-card";
import { FieldUpdateCard } from "@/components/ai-assistant/field-update-card";
import { OnboardingStatusCard } from "@/components/ai-assistant/onboarding-status-card";
import { useAIProductDraft } from "@/contexts/ai-product-draft-context";
import { useAIFormFields } from "@/contexts/ai-form-fields-context";
import { useOnboardingStatus } from "@/hooks/onboarding/use-onboarding-status";
import type { ExtractedProduct } from "@/lib/ai/extractors/product-extractor";
import type { FieldUpdate as ExtractedFieldUpdate } from "@/lib/ai/extractors/field-update-extractor";
import { BotIcon } from "lucide-react";

interface FieldUpdate {
  fieldName: string;
  value: unknown;
}

function formatPageLabel(page: string): string {
  const pageMap: Record<string, string> = {
    "/admin": "Dashboard",
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
    "/admin/risk-assessments": "Risk Assessments",
  };
  return pageMap[page] ?? page;
}

export function AdminRightSidebar() {
  const { isOpen } = useRightSidebar();
  const router = useRouter();
  const pathname = usePathname();
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

  const { setPendingDraft } = useAIProductDraft();
  const { setPendingFieldUpdates: setFormPendingUpdates } = useAIFormFields();
  const { data: onboardingStatus, isLoading: isLoadingOnboarding } =
    useOnboardingStatus();

  const storeId = onboardingStatus?.storeId;
  const [input, setInput] = useState("");

  const { messages, sendMessage, status } = useChat({
    // Start with fresh messages each session to avoid invalid message sequences
    // The Gemini API requires specific tool call ordering that's hard to maintain in storage
    transport: new DefaultChatTransport({
      api: "/api/ai/chat",
      body: {
        pathname,
        storeId,
      },
    }),
    onFinish: ({ message }) => {
      // Handle tool results
      if (message.parts) {
        message.parts.forEach((part) => {
          // Navigation tool
          if (part.type === "tool-navigate_to_page") {
            // Check if part has output (type guard)
            if ("output" in part) {
              const output = part.output as { page: string; reason?: string };
              if (output.page) {
                const pageLabel = formatPageLabel(output.page);
                setPendingNavigation({
                  page: output.page,
                  label: pageLabel,
                });
              }
            }
          }

          // Product draft tool
          if (part.type === "tool-create_product_draft") {
            // Check if part has output (type guard)
            if ("output" in part) {
              const draft = part.output as ExtractedProduct;
              setPendingDraft(draft);
              setCurrentDraft(draft);
              setTimeout(() => router.push("/admin/products/add"), 500);
            }
          }

          // Field update tool
          if (part.type === "tool-update_product_fields") {
            // Check if part has output (type guard)
            if ("output" in part) {
              const output = part.output as {
                updates: ExtractedFieldUpdate[];
                reasoning?: string;
              };
              if (output.updates && output.updates.length > 0) {
                const mappedUpdates = output.updates.map((update) => ({
                  fieldName: update.fieldName,
                  value: update.value,
                }));
                setPendingFieldUpdates(mappedUpdates);
                const updatesMap = output.updates.reduce(
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
        });
      }
    },
    onError: (error) => {
      console.error("Chat error:", error);
    },
  });

  const handleCloseChat = useCallback(() => {
    setCurrentDraft(null);
    setPendingFieldUpdates([]);
    setPendingNavigation(null);
    // Reload to reset chat
    window.location.reload();
  }, []);

  const handleApplyDraft = useCallback(
    (draft: ExtractedProduct) => {
      setPendingDraft(draft);
      setTimeout(() => router.push("/admin/products/add"), 500);
      // Don't clear currentDraft - let the card remain visible
    },
    [setPendingDraft, router],
  );

  const handleSendMessage = useCallback(
    (content: string) => {
      setCurrentDraft(null);
      setPendingFieldUpdates([]);
      setPendingNavigation(null);
      void sendMessage({ text: content });
    },
    [sendMessage],
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
                    // Apply updates to form but keep card visible
                    const updatesMap = pendingFieldUpdates.reduce(
                      (acc, update) => {
                        acc[update.fieldName] = update.value;
                        return acc;
                      },
                      {} as Record<string, unknown>,
                    );
                    setFormPendingUpdates(updatesMap);
                    // Don't clear pendingFieldUpdates - let the card remain visible
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
                  onClick={() => router.push(pendingNavigation.page)}
                  className="w-full rounded-lg bg-blue-50 px-4 py-2 text-left text-sm font-medium text-blue-600 transition-colors hover:bg-blue-100"
                >
                  → {pendingNavigation.label}
                </button>
              </div>
            )}
            {(status === "submitted" || status === "streaming") && (
              <TypingIndicator />
            )}
          </>
        )}
      </ChatbotBody>
      <ChatInput
        value={input}
        onChange={setInput}
        onSubmit={() => {
          if (input.trim()) {
            handleSendMessage(input.trim());
            setInput("");
          }
        }}
        disabled={status !== "ready"}
        placeholder="Ask me anything or describe a product..."
      />
    </aside>
  );
}
