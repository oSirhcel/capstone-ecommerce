import { useEffect, useState, useCallback } from "react";
import type { ChatMessage } from "@/types/ai-assistant";

const STORAGE_KEY = "ai-chat-history";
const MAX_HISTORY = 50;

/**
 * Hook for managing chat history persistence
 */
export function useChatHistory(_conversationId?: string) {
  const [history, setHistory] = useState<ChatMessage[]>([]);

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as ChatMessage[];
        setHistory(parsed);
      } catch (error) {
        console.error("Failed to parse chat history:", error);
      }
    }
  }, []);

  // Save history to localStorage
  const saveHistory = useCallback((messages: ChatMessage[]) => {
    try {
      const toSave = messages.slice(-MAX_HISTORY); // Keep only last 50 messages
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
      setHistory(toSave);
    } catch (error) {
      console.error("Failed to save chat history:", error);
    }
  }, []);

  // Add message to history
  const addMessage = useCallback(
    (message: ChatMessage) => {
      const updated = [...history, message];
      saveHistory(updated);
    },
    [history, saveHistory],
  );

  // Clear history
  const clearHistory = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setHistory([]);
  }, []);

  return {
    history,
    addMessage,
    clearHistory,
    saveHistory,
  };
}
