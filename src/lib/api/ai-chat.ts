import type { ChatMessage } from "@/types/ai-assistant";
import type { SuggestionChip } from "@/lib/ai/suggestions-generator";

export interface ChatRequest {
  messages: ChatMessage[];
  stream?: boolean;
  pathname?: string;
}

export interface ChatResponse {
  message: string;
  timestamp: string;
  toolCalls?: Array<{
    toolName: string;
    result: unknown;
  }>;
  suggestions?: SuggestionChip[];
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
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Add context headers
  if (request.pathname) {
    headers["x-pathname"] = request.pathname;
  }

  const response = await fetch("/api/ai/chat", {
    method: "POST",
    headers,
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
