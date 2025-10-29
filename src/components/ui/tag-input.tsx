"use client";

import { useState, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tag, X, Plus } from "lucide-react";

interface TagInputProps {
  tags?: string[];
  onTagsChange?: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
}

export function TagInput({
  tags: controlledTags,
  onTagsChange,
  placeholder = "Add a tag...",
  maxTags,
}: TagInputProps) {
  const [internalTags, setInternalTags] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");

  // Use controlled tags if provided, otherwise use internal state
  const tags = controlledTags ?? internalTags;
  const setTags = onTagsChange ?? setInternalTags;

  const addTag = () => {
    const trimmedValue = inputValue.trim();

    if (!trimmedValue) return;

    // Check if tag already exists
    if (tags.includes(trimmedValue)) {
      setInputValue("");
      return;
    }

    // Check max tags limit
    if (maxTags && tags.length >= maxTags) {
      return;
    }

    setTags([...tags, trimmedValue]);
    setInputValue("");
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <div className="w-full space-y-3">
      <div className="flex gap-2">
        <Input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button
          onClick={addTag}
          size="default"
          disabled={
            !inputValue.trim() || (maxTags ? tags.length >= maxTags : false)
          }
        >
          <Plus className="mr-2 h-4 w-4" />
          Add
        </Button>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="gap-1.5 py-1.5 pr-1 pl-2 text-sm"
            >
              <Tag className="h-3.5 w-3.5" />
              <span>{tag}</span>
              <button
                onClick={() => removeTag(tag)}
                className="hover:bg-muted-foreground/20 ml-1 rounded-sm p-0.5 transition-colors"
                aria-label={`Remove ${tag} tag`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
