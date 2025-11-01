import { useState, useCallback, useEffect } from "react";
import type { AIAction } from "@/types/ai-assistant";

interface PendingAction extends AIAction {
  id: string;
  timestamp: Date;
  status: "pending" | "in-progress" | "completed" | "failed";
}

const STORAGE_KEY = "ai-pending-actions";

/**
 * Hook for managing pending AI actions
 */
export function usePendingActions() {
  const [actions, setActions] = useState<PendingAction[]>([]);

  // Load actions from session storage
  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as PendingAction[];
        setActions(parsed);
      } catch (error) {
        console.error("Failed to parse pending actions:", error);
      }
    }
  }, []);

  // Save actions to session storage
  const saveActions = useCallback((updatedActions: PendingAction[]) => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updatedActions));
      setActions(updatedActions);
    } catch (error) {
      console.error("Failed to save pending actions:", error);
    }
  }, []);

  // Add a pending action
  const addAction = useCallback(
    (action: AIAction) => {
      const pendingAction: PendingAction = {
        ...action,
        id: `action-${Date.now()}`,
        timestamp: new Date(),
        status: "pending",
      };
      const updated = [...actions, pendingAction];
      saveActions(updated);
    },
    [actions, saveActions],
  );

  // Update action status
  const updateActionStatus = useCallback(
    (id: string, status: PendingAction["status"]) => {
      const updated = actions.map((action) =>
        action.id === id ? { ...action, status } : action,
      );
      saveActions(updated);
    },
    [actions, saveActions],
  );

  // Remove action
  const removeAction = useCallback(
    (id: string) => {
      const updated = actions.filter((action) => action.id !== id);
      saveActions(updated);
    },
    [actions, saveActions],
  );

  // Clear all actions
  const clearActions = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    setActions([]);
  }, []);

  // Get pending actions
  const pendingCount = actions.filter((a) => a.status === "pending").length;

  return {
    actions,
    pendingCount,
    addAction,
    updateActionStatus,
    removeAction,
    clearActions,
  };
}
