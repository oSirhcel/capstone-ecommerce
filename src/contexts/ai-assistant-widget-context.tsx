"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { WidgetState } from "@/types/ai-assistant";

interface WidgetContextValue {
  status: WidgetState;
  notificationCount: number;
  lastMessage?: string;
  expand: () => void;
  minimize: () => void;
  toggle: () => void;
  setNotificationCount: (count: number) => void;
  clearNotifications: () => void;
}

const WidgetContext = createContext<WidgetContextValue | undefined>(undefined);

const STORAGE_KEY = "ai-widget-state";

interface SavedState {
  status: WidgetState;
}

export function WidgetProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<WidgetState>("minimized");
  const [notificationCount, setNotificationCount] = useState(0);
  // const [lastMessage, _setLastMessage] = useState<string>();

  // Load saved state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as SavedState;
        setStatus(parsed.status);
      } catch (error) {
        console.error("Failed to parse saved widget state:", error);
      }
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    const stateToSave: SavedState = { status };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  }, [status]);

  const expand = useCallback(() => {
    setStatus("expanded");
  }, []);

  const minimize = useCallback(() => {
    setStatus("minimized");
  }, []);

  const toggle = useCallback(() => {
    setStatus((prev) => (prev === "minimized" ? "expanded" : "minimized"));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotificationCount(0);
  }, []);

  const handleSetNotificationCount = useCallback((count: number) => {
    setNotificationCount(count);
  }, []);

  return (
    <WidgetContext.Provider
      value={{
        status,
        notificationCount,
        // lastMessage,c
        expand,
        minimize,
        toggle,
        setNotificationCount: handleSetNotificationCount,
        clearNotifications,
      }}
    >
      {children}
    </WidgetContext.Provider>
  );
}

export function useWidgetState() {
  const context = useContext(WidgetContext);
  if (context === undefined) {
    throw new Error("useWidgetState must be used within a WidgetProvider");
  }
  return context;
}
