"use client";

import { useState } from "react";
import { RefreshCwIcon } from "lucide-react";
import { useRightSidebar } from "@/contexts/right-sidebar-context";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ChatbotHeaderProps {
  onReset: () => void;
}

export function ChatbotHeader({ onReset }: ChatbotHeaderProps) {
  const { close } = useRightSidebar();
  const [open, setOpen] = useState(false);

  const handleReset = () => {
    setOpen((prev) => !prev);
  };

  const handleConfirmReset = () => {
    onReset();
    setOpen(false);
  };

  return (
    <>
      <div className="flex h-14 items-center justify-between border-b px-4">
        <div className="text-lg font-semibold">Chat</div>
        <div className="flex items-center gap-2">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                onClick={handleReset}
                variant="ghost"
                size="icon"
                aria-label="Reset chat"
                title="Reset chat"
              >
                <RefreshCwIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-4">
              <div className="space-y-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Reset Chat?</p>
                  <p className="text-muted-foreground text-sm">
                    This will reset your conversation history.
                  </p>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleConfirmReset}>
                    Reset Chat
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </>
  );
}
