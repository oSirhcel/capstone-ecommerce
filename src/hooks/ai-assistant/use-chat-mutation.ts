import { useMutation } from "@tanstack/react-query";
import {
  sendChatMessage,
  type ChatRequest,
  type ChatResponse,
} from "@/lib/api/ai-chat";

/**
 * Hook for sending chat messages to the AI assistant
 */
export function useChatMutation() {
  return useMutation<ChatResponse, Error, ChatRequest>({
    mutationFn: sendChatMessage,
  });
}
