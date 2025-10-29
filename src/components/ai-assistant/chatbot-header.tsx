"use client";

import { useState } from "react";
import { Bot, Minimize2, X } from "lucide-react";
import { useWidgetState } from "@/contexts/ai-assistant-widget-context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ChatbotHeaderProps {
  onReset: () => void;
}

export function ChatbotHeader({ onReset }: ChatbotHeaderProps) {
  const { status, minimize } = useWidgetState();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleClose = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmClose = () => {
    onReset();
    setShowConfirmDialog(false);
    minimize();
  };

  return (
    <>
      <div className="flex h-14 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2">
          <Bot className="text-primary h-5 w-5" />
          <h2 className="font-semibold">AI Chatbot</h2>
        </div>
        <div className="flex items-center gap-2">
          {status === "expanded" && (
            <Button
              onClick={minimize}
              variant="ghost"
              size="icon"
              aria-label="Minimize chat"
              title="Minimize chat"
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
          )}
          <Button
            onClick={handleClose}
            variant="ghost"
            size="icon"
            aria-label="Close chat"
            title="Close chat"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close Chat?</DialogTitle>
            <DialogDescription>
              Are you sure you want to close the chat? This will clear your
              conversation history.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmClose}>
              Close Chat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
