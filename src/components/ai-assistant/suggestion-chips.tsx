"use client";

import { Button } from "@/components/ui/button";

interface SuggestionChip {
  label: string;
  actionType: "chat" | "navigate" | "action";
}

interface SuggestionChipsProps {
  suggestions: SuggestionChip[];
  onSuggestClick: (label: string) => void;
  disabled?: boolean;
}

export function SuggestionChips({
  suggestions,
  onSuggestClick,
  disabled = false,
}: SuggestionChipsProps) {
  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 border-t border-gray-200 px-4 py-3 dark:border-gray-700">
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Suggested next steps:
      </p>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, idx) => (
          <Button
            key={idx}
            variant="outline"
            size="sm"
            onClick={() => onSuggestClick(suggestion.label)}
            disabled={disabled}
            className="text-xs"
          >
            {suggestion.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
