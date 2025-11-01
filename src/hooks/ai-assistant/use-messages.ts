import { useState, useCallback } from "react";
import type { ChatMessage } from "@/types/ai-assistant";
import {
  MessageListUtils,
  StorageManager,
  MessageFactory,
} from "@/lib/ai/message-manager";

/**
 * Hook for managing chat messages with proper state management
 * Fixes stale closure bugs and uses lazy initialization
 */
export function useMessages() {
  // Lazy initialization - loadOrInitialize only runs once
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    MessageListUtils.loadOrInitialize(),
  );

  /**
   * Add a message to the list
   * Uses functional update to avoid stale closure
   */
  const addMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => {
      const updated = MessageListUtils.add(prev, message);
      StorageManager.save(updated);
      return updated;
    });
  }, []);

  /**
   * Add multiple messages at once
   */
  const addMessages = useCallback((newMessages: ChatMessage[]) => {
    setMessages((prev) => {
      const updated = [...prev, ...newMessages];
      StorageManager.save(updated);
      return updated;
    });
  }, []);

  /**
   * Replace all messages
   */
  const setAllMessages = useCallback((newMessages: ChatMessage[]) => {
    const updated = MessageListUtils.replace(newMessages);
    setMessages(updated);
    StorageManager.save(updated);
  }, []);

  /**
   * Clear history and reset to welcome message
   */
  const clearHistory = useCallback(() => {
    const initialized = MessageListUtils.initialize();
    setMessages(initialized);
    StorageManager.clear();
  }, []);

  /**
   * Reset to initial state (from storage or welcome)
   */
  const reset = useCallback(() => {
    const initialized = MessageListUtils.loadOrInitialize();
    setMessages(initialized);
  }, []);

  return {
    messages,
    addMessage,
    addMessages,
    setAllMessages,
    clearHistory,
    reset,
    // Expose factory for convenience
    createMessage: MessageFactory,
  };
}
