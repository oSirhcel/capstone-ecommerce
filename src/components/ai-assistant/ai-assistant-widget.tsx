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
import { ProductDraftCard } from "./product-draft-card";
import { FieldUpdateCard } from "./field-update-card";
import { useAIProductDraft } from "@/contexts/ai-product-draft-context";
import { useAIFormFields } from "@/contexts/ai-form-fields-context";
import { useChatMutation } from "@/hooks/ai-assistant/use-chat-mutation";
import { useMessages } from "@/hooks/ai-assistant/use-messages";
import { usePageContext } from "@/hooks/ai-assistant/use-page-context";
import { useProductExtraction } from "@/hooks/ai-assistant/use-product-extraction";
import { isEditInstruction } from "@/lib/ai/extractors/field-update-extractor";
import type { ExtractedProduct } from "@/lib/ai/extractors/product-extractor";

export function AIAssistantWidget() {
  const router = useRouter();
  const { isOnAddProductPage } = usePageContext();
  const [pendingFieldUpdates, setPendingFieldUpdatesState] = useState<Array<{
    fieldName: string;
    value: unknown;
  }> | null>(null);
  const [updateMessageId, setUpdateMessageId] = useState<string | null>(null);
  const [isLoadingUpdates, setIsLoadingUpdates] = useState(false);

  // Use new hooks
  const { messages, addMessage, clearHistory, createMessage } = useMessages();
  const chatMutation = useChatMutation();
  const { currentDraft, extractProduct, clearDraft, isExtracting } =
    useProductExtraction();
  const { setPendingDraft } = useAIProductDraft();
  const { setPendingFieldUpdates } = useAIFormFields();

  // Get current form data from context
  // This is updated by the form component via updateFormData
  const { currentFormData } = useAIFormFields();

  // Close chat and reset to initial state
  const handleCloseChat = useCallback(() => {
    clearHistory();
  }, [clearHistory]);

  const handleSendMessage = useCallback(
    async (content: string) => {
      // Clear any previous field updates when sending a new message
      setPendingFieldUpdatesState(null);
      setUpdateMessageId(null);

      // Add user message using factory
      const userMessage = createMessage.user(content);
      addMessage(userMessage);

      // Check if user is requesting to edit form fields
      if (isEditInstruction(content) && currentFormData && isOnAddProductPage) {
        try {
          setIsLoadingUpdates(true);
          const response = await fetch("/api/ai/extract-field-updates", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              instruction: content,
              currentFormData: currentFormData,
            }),
          });

          if (!response.ok) {
            throw new Error("Failed to extract field updates");
          }

          const data = (await response.json()) as {
            updates?: Array<{ fieldName: string; value: unknown }>;
          };

          // Validate response structure
          if (
            data.updates &&
            Array.isArray(data.updates) &&
            data.updates.length > 0
          ) {
            // Store pending updates for display
            setPendingFieldUpdatesState(data.updates);

            // Add confirmation message using factory
            const fieldNames = data.updates.map((u) => u.fieldName);
            const updateMessage = createMessage.fieldUpdate(fieldNames);

            setUpdateMessageId(updateMessage.id);
            addMessage(updateMessage);
            setIsLoadingUpdates(false);
            return;
          }
        } catch (error) {
          console.error("Field update extraction failed:", error);
          setIsLoadingUpdates(false);
          // Fall through to regular chat
        }
      }

      // Check if user is describing a product (simple heuristics)
      const isProductDescription =
        content.toLowerCase().includes("product") ||
        content.toLowerCase().includes("price") ||
        content.toLowerCase().includes("stock") ||
        content.toLowerCase().includes("sell");

      // If describing a product, try to extract product data
      if (isProductDescription) {
        try {
          const extractionResult = await extractProduct(content);

          if (extractionResult.success && extractionResult.data) {
            // Add extraction result using factory
            const extractionMessage = createMessage.productExtraction();
            addMessage(extractionMessage);
            return;
          }
        } catch (error) {
          console.error("Product extraction failed:", error);
          // Fall through to regular chat
        }
      }

      // Regular chat response
      try {
        const response = await chatMutation.mutateAsync({
          messages: [...messages, userMessage],
        });

        const assistantMessage = createMessage.assistant(response.message);
        addMessage(assistantMessage);
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
      extractProduct,
      currentFormData,
      isOnAddProductPage,
      setPendingFieldUpdatesState,
      setUpdateMessageId,
      setIsLoadingUpdates,
    ],
  );

  const handleApplyDraft = useCallback(
    (draft: ExtractedProduct) => {
      // Set the draft as pending for the form to pick up
      setPendingDraft(draft);

      // If not on add product page, navigate there
      if (!isOnAddProductPage) {
        router.push("/admin/products/add");
      }
    },
    [isOnAddProductPage, setPendingDraft, router],
  );

  const handleApplyFieldUpdates = useCallback(() => {
    if (!pendingFieldUpdates) return;

    // Convert to context format
    const updates: Record<string, unknown> = {};
    for (const update of pendingFieldUpdates) {
      updates[update.fieldName] = update.value;
    }

    // Set pending updates in context - this triggers form updates
    setPendingFieldUpdates(updates);

    // Clear the draft so it doesn't show again
    clearDraft();

    // Don't clear pending updates or message ID yet - let the card stay visible
    // It will be cleared when user sends another message or closes chat
  }, [pendingFieldUpdates, setPendingFieldUpdates, clearDraft]);

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
                  {message.type === "action" &&
                    message.id !== updateMessageId &&
                    currentDraft &&
                    !updateMessageId && (
                      <ProductDraftCard
                        draft={currentDraft}
                        onApply={handleApplyDraft}
                      />
                    )}
                  {message.id === updateMessageId && pendingFieldUpdates && (
                    <FieldUpdateCard
                      updates={pendingFieldUpdates}
                      onApply={handleApplyFieldUpdates}
                    />
                  )}
                </div>
              ))}
              {(chatMutation.isPending || isExtracting || isLoadingUpdates) && (
                <TypingIndicator />
              )}
            </>
          )}
        </ChatbotBody>
        <ChatInput
          onSend={handleSendMessage}
          disabled={chatMutation.isPending || isExtracting}
          placeholder="Ask me anything or describe a product..."
        />
      </ChatbotWindow>
    </>
  );
}
