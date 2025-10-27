"use client";

import { Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWidgetState } from "@/contexts/ai-assistant-widget-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function ChatbotButton() {
  const { status, notificationCount, toggle } = useWidgetState();

  // Don't render if already expanded
  if (status !== "minimized") {
    return null;
  }

  return (
    <div className="fixed right-6 bottom-6 z-50 md:right-6 md:bottom-6">
      <Button
        onClick={toggle}
        size="icon"
        className={cn(
          "h-14 w-14 rounded-full shadow-lg transition-all hover:scale-105 hover:shadow-xl",
        )}
        aria-label="Open AI Assistant"
      >
        <Bot className="h-6 w-6" />
        {notificationCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full p-0 text-xs font-bold"
          >
            {notificationCount > 9 ? "9+" : notificationCount}
          </Badge>
        )}
      </Button>
    </div>
  );
}
