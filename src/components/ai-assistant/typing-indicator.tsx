"use client";

import { Bot } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function TypingIndicator() {
  return (
    <div className="mb-4 flex gap-3">
      <Avatar className="bg-muted">
        <AvatarFallback>
          <Bot className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
      <div className="bg-muted flex items-center gap-1 rounded-lg px-4 py-2">
        <div className="flex gap-1">
          <div className="bg-foreground h-2 w-2 animate-bounce rounded-full [animation-delay:-0.3s]" />
          <div className="bg-foreground h-2 w-2 animate-bounce rounded-full [animation-delay:-0.15s]" />
          <div className="bg-foreground h-2 w-2 animate-bounce rounded-full" />
        </div>
      </div>
    </div>
  );
}
