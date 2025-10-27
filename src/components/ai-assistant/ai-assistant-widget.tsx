"use client";

import { useState, useEffect, useCallback } from "react";
import { ChatbotButton } from "./chatbot-button";
import { ChatbotWindow } from "./chatbot-window";
import { ChatbotHeader } from "./chatbot-header";
import { ChatbotBody } from "./chatbot-body";
import { ChatInput } from "./chat-input";
import { ChatMessage } from "./chat-message";
import { TypingIndicator } from "./typing-indicator";
import { useWidgetState } from "@/contexts/ai-assistant-widget-context";
import { useChatMutation } from "@/hooks/ai-assistant/use-chat-mutation";
import type {
  ChatMessage as ChatMessageType,
  ChatMode,
} from "@/types/ai-assistant";

export function AIAssistantWidget() {
  const { mode } = useWidgetState();
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const chatMutation = useChatMutation();

  // Create welcome message helper
  const createWelcomeMessage = useCallback((): ChatMessageType => {
    return {
      id: "welcome",
      role: "assistant",
      content: getWelcomeMessage(mode),
      timestamp: new Date(),
    };
  }, [mode]);

  // Initialize with welcome message
  useEffect(() => {
    setMessages([createWelcomeMessage()]);
  }, [createWelcomeMessage]);

  // Close chat and reset to initial state
  const handleCloseChat = useCallback(() => {
    setMessages([createWelcomeMessage()]);
  }, [createWelcomeMessage]);

  const handleSendMessage = useCallback(
    async (content: string) => {
      // Add user message
      const userMessage: ChatMessageType = {
        id: `user-${Date.now()}`,
        role: "user",
        content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);

      try {
        const response = await chatMutation.mutateAsync({
          messages: [...messages, userMessage],
          mode,
        });

        const assistantMessage: ChatMessageType = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: response.message,
          timestamp: new Date(response.timestamp),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (error) {
        console.error("Error sending message:", error);
        const errorMessage: ChatMessageType = {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    },
    [messages, mode, chatMutation],
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
                <ChatMessage key={message.id} message={message} />
              ))}
              {chatMutation.isPending && <TypingIndicator />}
            </>
          )}
        </ChatbotBody>
        <ChatInput
          onSend={handleSendMessage}
          disabled={chatMutation.isPending}
          placeholder={getInputPlaceholder(mode)}
        />
      </ChatbotWindow>
    </>
  );
}

function getWelcomeMessage(mode: ChatMode): string {
  switch (mode) {
    case "onboarding":
      return "Welcome! I'm here to help you set up your store. Let's start by completing your store details.";
    case "product-creation":
      return "I can help you create products from descriptions. Just tell me about your product and I'll guide you through creating it!";
    case "form-filling":
      return "I can help you fill out forms on this page. What would you like to know?";
    default:
      return "Hi! I'm your AI assistant. I can help you with store setup, product creation, and more. What can I help you with today?";
  }
}

function getInputPlaceholder(mode: ChatMode): string {
  switch (mode) {
    case "onboarding":
      return "Ask about store setup...";
    case "product-creation":
      return "Describe your product...";
    case "form-filling":
      return "Ask about form fields...";
    default:
      return "Type your message...";
  }
}
