"use client";

import React, { useState } from "react";
import { useDebounceCallback } from "usehooks-ts";
import { Loader2Icon, SparklesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { useSlugGeneration } from "@/hooks/onboarding/use-slug-generation";
import { useSlugAvailability } from "@/hooks/onboarding/use-slug-availability";

interface SlugInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  storeName?: string; // For generating suggestions
}

export function SlugInput({
  value,
  onChange,
  placeholder = "my-store",
  disabled = false,
  storeName,
}: SlugInputProps) {
  const [slugQuery, setSlugQuery] = useState("");
  const [generatedSlugs, setGeneratedSlugs] = useState<string[]>([]);
  const [isGeneratingSlugs, setIsGeneratingSlugs] = useState(false);

  const slugMutation = useSlugGeneration();
  const { data: isSlugAvailable, isLoading: isSlugLoading } =
    useSlugAvailability(slugQuery);

  const debouncedSlug = useDebounceCallback(setSlugQuery, 300);

  const generateSlugs = async () => {
    if (!storeName) return;

    setIsGeneratingSlugs(true);
    try {
      const slugs = await slugMutation.mutateAsync(storeName);
      setGeneratedSlugs(slugs);
    } catch (error) {
      console.error("Failed to generate slugs:", error);
    } finally {
      setIsGeneratingSlugs(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    debouncedSlug(e.target.value);
  };

  return (
    <div className="space-y-3">
      <InputGroup>
        <InputGroupInput
          placeholder={placeholder}
          className="!pl-1"
          value={value}
          onChange={handleInputChange}
          disabled={disabled}
        />
        <InputGroupAddon>
          <InputGroupText className="text-muted-foreground">
            https://buyio.com/stores/
          </InputGroupText>
        </InputGroupAddon>
        {storeName && (
          <InputGroupAddon align="inline-end">
            <Tooltip>
              <TooltipTrigger asChild>
                <InputGroupButton
                  size="icon-sm"
                  className="text-primary"
                  onClick={generateSlugs}
                  disabled={isGeneratingSlugs || disabled}
                  title="Generate AI suggestions"
                >
                  {isGeneratingSlugs ? (
                    <Loader2Icon className="size-4 animate-spin" />
                  ) : (
                    <SparklesIcon className="size-4" />
                  )}
                </InputGroupButton>
              </TooltipTrigger>
              <TooltipContent>
                Generate AI suggestions for your store URL.
              </TooltipContent>
            </Tooltip>
          </InputGroupAddon>
        )}
      </InputGroup>

      {generatedSlugs.length > 0 && (
        <div className="space-y-2">
          <p className="text-muted-foreground text-xs">
            Available suggestions:
          </p>
          <div className="flex flex-wrap gap-2">
            {generatedSlugs.map((slug) => (
              <Button
                key={slug}
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => onChange(slug)}
                disabled={disabled}
              >
                {slug}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Availability status */}
      {slugQuery.length >= 3 && (
        <div className="text-xs">
          {isSlugLoading ? (
            <span>Checking availability…</span>
          ) : isSlugAvailable ? (
            <span className="text-green-500">This slug is available!</span>
          ) : (
            <span className="text-rose-500">This slug is taken.</span>
          )}
        </div>
      )}
    </div>
  );
}
