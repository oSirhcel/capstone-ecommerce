import type { UIMessage } from "ai";

const STORAGE_KEY = "ai-chat-history";
const MAX_HISTORY = 50;

/**
 * Load messages from localStorage
 */
export function loadMessagesFromStorage(): UIMessage[] {
  if (typeof window === "undefined") return [];

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];

    const parsed = JSON.parse(saved) as UIMessage[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Failed to parse chat history:", error);
    return [];
  }
}

/**
 * Save messages to localStorage
 */
export function saveMessagesToStorage(messages: UIMessage[]): void {
  if (typeof window === "undefined") return;

  try {
    const toSave = messages.slice(-MAX_HISTORY);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (error) {
    console.error("Failed to save chat history:", error);
  }
}

/**
 * Clear messages from localStorage
 */
export function clearMessagesFromStorage(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear chat history:", error);
  }
}
