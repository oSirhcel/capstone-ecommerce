"use client";

import { type ReactNode, useEffect, useRef } from "react";

interface ChatbotBodyProps {
  children: ReactNode;
}

export function ChatbotBody({ children }: ChatbotBodyProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when children change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [children]);

  return (
    <div
      ref={scrollRef}
      className="scrollbar-thin flex-1 overflow-y-auto p-4"
      style={{
        scrollbarWidth: "thin",
        scrollbarColor: "var(--border) transparent",
      }}
    >
      {children}
    </div>
  );
}
