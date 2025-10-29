"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { ExtractedProduct } from "@/lib/ai/extractors/product-extractor";

interface AIProductDraftContextValue {
  pendingDraft: ExtractedProduct | null;
  setPendingDraft: (draft: ExtractedProduct | null) => void;
  clearPendingDraft: () => void;
}

const AIProductDraftContext = createContext<
  AIProductDraftContextValue | undefined
>(undefined);

export function AIProductDraftProvider({ children }: { children: ReactNode }) {
  const [pendingDraft, setPendingDraft] = useState<ExtractedProduct | null>(
    null,
  );

  const clearPendingDraft = useCallback(() => {
    setPendingDraft(null);
  }, []);

  return (
    <AIProductDraftContext.Provider
      value={{
        pendingDraft,
        setPendingDraft,
        clearPendingDraft,
      }}
    >
      {children}
    </AIProductDraftContext.Provider>
  );
}

export function useAIProductDraft() {
  const context = useContext(AIProductDraftContext);
  if (context === undefined) {
    throw new Error(
      "useAIProductDraft must be used within an AIProductDraftProvider",
    );
  }
  return context;
}
