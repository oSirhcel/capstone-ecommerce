"use client";

import { useState, type KeyboardEvent } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, disabled, placeholder }: ChatInputProps) {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-center gap-2 border-t p-4">
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder ?? "Type your message..."}
        disabled={disabled}
        rows={1}
        className={cn(
          "max-h-[120px] min-h-[44px] resize-none",
          "focus-visible:ring-primary",
        )}
      />
      <Button
        onClick={handleSend}
        disabled={disabled ?? !message.trim()}
        size="icon"
        className="shrink-0"
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );
}
