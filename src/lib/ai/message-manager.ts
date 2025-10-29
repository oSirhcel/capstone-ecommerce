import type { ChatMessage } from "@/types/ai-assistant";

const STORAGE_KEY = "ai-chat-history";
const MAX_HISTORY = 50;

/**
 * Message factory functions
 * Pure functions for creating standardized messages
 */
export const MessageFactory = {
  welcome(): ChatMessage {
    return {
      id: "welcome",
      role: "assistant",
      content:
        "Hi! I'm your AI assistant. I can help you with store management, product creation, and more. What can I help you with?",
      timestamp: new Date(),
    };
  },

  user(content: string): ChatMessage {
    return {
      id: `user-${Date.now()}`,
      role: "user",
      content,
      timestamp: new Date(),
    };
  },

  assistant(content: string): ChatMessage {
    return {
      id: `assistant-${Date.now()}`,
      role: "assistant",
      content,
      timestamp: new Date(),
    };
  },

  error(
    message = "Sorry, I encountered an error. Please try again.",
  ): ChatMessage {
    return {
      id: `error-${Date.now()}`,
      role: "assistant",
      content: message,
      timestamp: new Date(),
    };
  },

  action(content: string, actionId?: string): ChatMessage {
    return {
      id: actionId ?? `action-${Date.now()}`,
      role: "assistant",
      content,
      timestamp: new Date(),
      type: "action",
    };
  },

  productExtraction(): ChatMessage {
    return {
      id: `extraction-${Date.now()}`,
      role: "assistant",
      content:
        "I've extracted the product details. Please review the draft below:",
      timestamp: new Date(),
      type: "action",
    };
  },

  fieldUpdate(fieldNames: string[]): ChatMessage {
    const fields = fieldNames.join(", ");
    return {
      id: `update-${Date.now()}`,
      role: "assistant",
      content: `I'll update ${fields}. Please review the changes below:`,
      timestamp: new Date(),
      type: "action",
    };
  },

  confirmation(message: string): ChatMessage {
    return {
      id: `confirm-${Date.now()}`,
      role: "assistant",
      content: message,
      timestamp: new Date(),
    };
  },
};

/**
 * LocalStorage utilities for chat history
 * Isolated for easy testing and mocking
 */
export const StorageManager = {
  load(): ChatMessage[] {
    if (typeof window === "undefined") return [];

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return [];

      const parsed = JSON.parse(saved) as ChatMessage[];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error("Failed to parse chat history:", error);
      return [];
    }
  },

  save(messages: ChatMessage[]): void {
    if (typeof window === "undefined") return;

    try {
      const toSave = messages.slice(-MAX_HISTORY);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (error) {
      console.error("Failed to save chat history:", error);
    }
  },

  clear(): void {
    if (typeof window === "undefined") return;

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Failed to clear chat history:", error);
    }
  },
};

/**
 * Message list utilities
 * Pure functions for message operations
 */
export const MessageListUtils = {
  /**
   * Add a message to the list
   * Returns a new array (immutable)
   */
  add(messages: ChatMessage[], message: ChatMessage): ChatMessage[] {
    return [...messages, message];
  },

  /**
   * Replace the entire message list
   * Returns a new array (immutable)
   */
  replace(newMessages: ChatMessage[]): ChatMessage[] {
    return [...newMessages];
  },

  /**
   * Initialize with welcome message
   */
  initialize(): ChatMessage[] {
    return [MessageFactory.welcome()];
  },

  /**
   * Load from storage or initialize
   */
  loadOrInitialize(): ChatMessage[] {
    const saved = StorageManager.load();
    return saved.length > 0 ? saved : MessageListUtils.initialize();
  },
};
