import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import type { ExtractedProduct } from "@/lib/ai/extractors/product-extractor";

interface ExtractProductRequest {
  description: string;
}

interface ExtractProductResponse {
  success: boolean;
  data: ExtractedProduct;
}

export function useProductExtraction() {
  const [currentDraft, setCurrentDraft] = useState<ExtractedProduct | null>(
    null,
  );

  const extractionMutation = useMutation<
    ExtractProductResponse,
    Error,
    ExtractProductRequest
  >({
    mutationFn: async (request) => {
      const response = await fetch("/api/ai/extract-product", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = (await response.json()) as { error?: string };
        throw new Error(error.error ?? "Failed to extract product");
      }

      return (await response.json()) as ExtractProductResponse;
    },
    onSuccess: (data) => {
      if (data.success && data.data) {
        setCurrentDraft(data.data);
      }
    },
  });

  const extractProduct = useCallback(
    async (description: string) => {
      return extractionMutation.mutateAsync({ description });
    },
    [extractionMutation],
  );

  const updateDraft = useCallback((updates: Partial<ExtractedProduct>) => {
    setCurrentDraft((prev) => {
      if (!prev) return null;
      return { ...prev, ...updates };
    });
  }, []);

  const clearDraft = useCallback(() => {
    setCurrentDraft(null);
  }, []);

  return {
    currentDraft,
    extractProduct,
    updateDraft,
    clearDraft,
    isExtracting: extractionMutation.isPending,
    extractionError: extractionMutation.error,
  };
}
