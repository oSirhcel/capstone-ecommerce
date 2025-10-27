"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useWidgetState } from "@/contexts/ai-assistant-widget-context";

interface ChatbotWindowProps {
  children: ReactNode;
}

export function ChatbotWindow({ children }: ChatbotWindowProps) {
  const { status } = useWidgetState();

  // Don't render if minimized
  if (status === "minimized") {
    return null;
  }

  return (
    <div
      className={cn(
        "bg-background fixed right-6 bottom-6 z-50 flex h-[600px] w-[400px] flex-col rounded-lg border shadow-2xl transition-all duration-300 ease-out",
        "animate-in fade-in slide-in-from-bottom-4 slide-in-from-right-4",
        "md:h-[600px] md:w-[400px]",
        "max-md:right-4 max-md:bottom-4 max-md:h-[calc(100vh-32px)] max-md:w-[calc(100vw-32px)]",
      )}
    >
      {children}
    </div>
  );
}
