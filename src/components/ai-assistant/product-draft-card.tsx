"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ExtractedProduct } from "@/lib/ai/extractors/product-extractor";

interface ProductDraftCardProps {
  draft: ExtractedProduct;
  onApply: (draft: ExtractedProduct) => void;
}

export function ProductDraftCard({ draft, onApply }: ProductDraftCardProps) {
  const [isApplied, setIsApplied] = useState(false);

  const handleApply = () => {
    onApply(draft);
    setIsApplied(true);
  };

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) {
      return "—";
    }
    if (typeof value === "string") {
      return value;
    }
    if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    }
    if (typeof value === "number") {
      return value.toString();
    }
    if (Array.isArray(value)) {
      return value.join(", ");
    }
    if (typeof value === "object") {
      try {
        return JSON.stringify(value);
      } catch {
        return "[object]";
      }
    }
    try {
      return JSON.stringify(value);
    } catch {
      return "[unknown]";
    }
  };

  const allFields = [
    { key: "name" as const, label: "Title" },
    { key: "description" as const, label: "Description" },
    { key: "price" as const, label: "Price" },
    { key: "stock" as const, label: "Stock" },
    { key: "sku" as const, label: "SKU" },
    { key: "categoryId" as const, label: "Category" },
    { key: "tags" as const, label: "Tags" },
    { key: "seoTitle" as const, label: "SEO Title" },
    { key: "seoDescription" as const, label: "SEO Description" },
    { key: "compareAtPrice" as const, label: "Compare at Price" },
    { key: "costPerItem" as const, label: "Cost Per Item" },
    { key: "weight" as const, label: "Weight" },
    { key: "length" as const, label: "Length" },
    { key: "width" as const, label: "Width" },
    { key: "height" as const, label: "Height" },
    { key: "trackQuantity" as const, label: "Track Quantity" },
    { key: "allowBackorders" as const, label: "Allow Backorders" },
    { key: "featured" as const, label: "Featured" },
  ];

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-normal">{draft.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <ul className="bg-muted space-y-2 rounded-lg p-4">
          {allFields.map(({ key, label }) => {
            const value = draft[key as keyof ExtractedProduct];
            return (
              <li key={key} className="flex items-start gap-2">
                <span className="text-muted-foreground mt-[3px] text-xs">
                  ●
                </span>
                <div className="text-sm">
                  <span className="font-medium">{label}:</span>{" "}
                  <span className="text-foreground">{formatValue(value)}</span>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="flex flex-col gap-2 pt-1">
          <Button
            onClick={handleApply}
            className="w-full bg-purple-50 text-purple-600 hover:bg-purple-100 hover:text-purple-700"
            variant="ghost"
            disabled={isApplied}
            size="sm"
          >
            {isApplied ? (
              <>
                <Check className="mr-2 h-4 w-4" /> Applied
              </>
            ) : (
              "Preview"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
