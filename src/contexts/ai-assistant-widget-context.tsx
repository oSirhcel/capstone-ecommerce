"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import type {
  WidgetState,
  NotificationBadge,
  ChatMode,
} from "@/types/ai-assistant";

interface WidgetContextValue {
  status: WidgetState;
  notificationCount: number;
  lastMessage?: string;
  mode: ChatMode;
  expand: () => void;
  minimize: () => void;
  toggle: () => void;
  setNotificationCount: (count: number) => void;
  clearNotifications: () => void;
  setMode: (mode: ChatMode) => void;
}

const WidgetContext = createContext<WidgetContextValue | undefined>(undefined);

const STORAGE_KEY = "ai-widget-state";

interface SavedState {
  status: WidgetState;
  mode: ChatMode;
}

export function WidgetProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<WidgetState>("minimized");
  const [notificationCount, setNotificationCount] = useState(0);
  const [lastMessage, setLastMessage] = useState<string>();
  const [mode, setMode] = useState<ChatMode>("general");

  // Load saved state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as SavedState;
        setStatus(parsed.status);
        setMode(parsed.mode);
      } catch (error) {
        console.error("Failed to parse saved widget state:", error);
      }
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    const stateToSave: SavedState = { status, mode };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  }, [status, mode]);

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

  const handleSetMode = useCallback((newMode: ChatMode) => {
    setMode(newMode);
  }, []);

  const handleSetNotificationCount = useCallback((count: number) => {
    setNotificationCount(count);
  }, []);

  return (
    <WidgetContext.Provider
      value={{
        status,
        notificationCount,
        lastMessage,
        mode,
        expand,
        minimize,
        toggle,
        setNotificationCount: handleSetNotificationCount,
        clearNotifications,
        setMode: handleSetMode,
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
