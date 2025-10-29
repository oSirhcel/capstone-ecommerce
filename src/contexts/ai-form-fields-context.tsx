"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

interface AIFormFieldsContextValue {
  aiFilledFields: Set<string>;
  markFieldAsFilled: (fieldName: string) => void;
  markFieldsAsFilled: (fieldNames: string[]) => void;
  clearFilledFields: () => void;
  isFieldFilled: (fieldName: string) => boolean;
  pendingFieldUpdates: Record<string, unknown> | null;
  setPendingFieldUpdates: (updates: Record<string, unknown> | null) => void;
  currentFormData: Record<string, unknown> | null;
  updateFormData: (data: Record<string, unknown>) => void;
}

const AIFormFieldsContext = createContext<AIFormFieldsContextValue | undefined>(
  undefined,
);

export function AIFormFieldsProvider({ children }: { children: ReactNode }) {
  const [aiFilledFields, setAiFilledFields] = useState<Set<string>>(new Set());
  const [pendingFieldUpdates, setPendingFieldUpdates] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [currentFormData, setCurrentFormData] = useState<Record<
    string,
    unknown
  > | null>(null);

  const markFieldAsFilled = useCallback((fieldName: string) => {
    setAiFilledFields((prev) => new Set(prev).add(fieldName));
  }, []);

  const markFieldsAsFilled = useCallback((fieldNames: string[]) => {
    setAiFilledFields((prev) => {
      const updated = new Set(prev);
      fieldNames.forEach((name) => updated.add(name));
      return updated;
    });
  }, []);

  const clearFilledFields = useCallback(() => {
    setAiFilledFields(new Set());
  }, []);

  const isFieldFilled = useCallback(
    (fieldName: string) => {
      return aiFilledFields.has(fieldName);
    },
    [aiFilledFields],
  );

  const updateFormData = useCallback((data: Record<string, unknown>) => {
    setCurrentFormData(data);
  }, []);

  return (
    <AIFormFieldsContext.Provider
      value={{
        aiFilledFields,
        markFieldAsFilled,
        markFieldsAsFilled,
        clearFilledFields,
        isFieldFilled,
        pendingFieldUpdates,
        setPendingFieldUpdates,
        currentFormData,
        updateFormData,
      }}
    >
      {children}
    </AIFormFieldsContext.Provider>
  );
}

export function useAIFormFields() {
  const context = useContext(AIFormFieldsContext);
  if (context === undefined) {
    throw new Error(
      "useAIFormFields must be used within an AIFormFieldsProvider",
    );
  }
  return context;
}
