"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface FieldUpdate {
  fieldName: string;
  value: unknown;
}

interface FieldUpdateCardProps {
  updates: FieldUpdate[];
  onApply: () => void;
}

export function FieldUpdateCard({ updates, onApply }: FieldUpdateCardProps) {
  const [isApplied, setIsApplied] = useState(false);

  const handleApply = () => {
    onApply();
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

  const formatFieldName = (fieldName: string): string => {
    // Convert camelCase to Title Case
    return fieldName
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-base font-normal">Field Updates</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <ul className="bg-muted space-y-2 rounded-lg p-4">
          {updates.map((update, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="text-muted-foreground mt-[3px] text-xs">●</span>
              <div className="text-sm">
                <span className="font-medium">
                  {formatFieldName(update.fieldName)}:
                </span>{" "}
                <span className="text-foreground">
                  {formatValue(update.value)}
                </span>
              </div>
            </li>
          ))}
        </ul>

        <Button
          onClick={handleApply}
          className="w-full bg-purple-50 text-purple-600 hover:bg-purple-100 hover:text-purple-700"
          variant="ghost"
          size="sm"
          disabled={isApplied}
        >
          {isApplied ? (
            <>
              <Check className="mr-2 h-4 w-4" /> Applied
            </>
          ) : (
            "Preview"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
