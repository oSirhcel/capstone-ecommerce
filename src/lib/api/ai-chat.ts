import type { ChatMessage, ChatMode } from "@/types/ai-assistant";

export interface ChatRequest {
  messages: ChatMessage[];
  mode: ChatMode;
  stream?: boolean;
}

export interface ChatResponse {
  message: string;
  timestamp: string;
}

export interface ChatErrorResponse {
  error: string;
}

/**
 * Send a chat message to the AI assistant
 */
export async function sendChatMessage(
  request: ChatRequest,
): Promise<ChatResponse> {
  const response = await fetch("/api/ai/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = (await response.json()) as ChatErrorResponse;
    throw new Error(errorData.error || "Failed to get AI response");
  }

  return (await response.json()) as ChatResponse;
}

/**
 * Check if chat streaming is supported
 */
export function isStreamingSupported(): boolean {
  return typeof window !== "undefined" && "EventSource" in window;
}
