"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { ExtractedProduct } from "@/lib/ai/extractors/product-extractor";

interface ProductFormFillContextValue {
  pendingDraft: ExtractedProduct | null;
  setPendingDraft: (draft: ExtractedProduct | null) => void;
  clearPendingDraft: () => void;
  aiFilledFields: Set<string>;
  markFieldAsFilled: (fieldName: string) => void;
  clearFilledFields: () => void;
  currentFormData: Record<string, unknown> | null;
  updateFormData: (data: Record<string, unknown>) => void;
  pendingFieldUpdates: Record<string, unknown> | null;
  setPendingFieldUpdates: (updates: Record<string, unknown> | null) => void;
}

const ProductFormFillContext = createContext<
  ProductFormFillContextValue | undefined
>(undefined);

export function ProductFormFillProvider({ children }: { children: ReactNode }) {
  const [pendingDraft, setPendingDraft] = useState<ExtractedProduct | null>(
    null,
  );
  const [aiFilledFields, setAiFilledFields] = useState<Set<string>>(new Set());
  const [currentFormData, setCurrentFormData] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [pendingFieldUpdates, setPendingFieldUpdates] = useState<Record<
    string,
    unknown
  > | null>(null);

  const clearPendingDraft = useCallback(() => {
    setPendingDraft(null);
  }, []);

  const markFieldAsFilled = useCallback((fieldName: string) => {
    setAiFilledFields((prev) => new Set(prev).add(fieldName));
  }, []);

  const clearFilledFields = useCallback(() => {
    setAiFilledFields(new Set());
  }, []);

  const updateFormData = useCallback((data: Record<string, unknown>) => {
    setCurrentFormData(data);
  }, []);

  return (
    <ProductFormFillContext.Provider
      value={{
        pendingDraft,
        setPendingDraft,
        clearPendingDraft,
        aiFilledFields,
        markFieldAsFilled,
        clearFilledFields,
        currentFormData,
        updateFormData,
        pendingFieldUpdates,
        setPendingFieldUpdates,
      }}
    >
      {children}
    </ProductFormFillContext.Provider>
  );
}

export function useProductFormFill() {
  const context = useContext(ProductFormFillContext);
  if (context === undefined) {
    throw new Error(
      "useProductFormFill must be used within a ProductFormFillProvider",
    );
  }
  return context;
}
