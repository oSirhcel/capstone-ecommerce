"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Eye, Edit3 } from "lucide-react";

interface PolicyEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
  onUseDefault?: () => void;
  onGenerateAI?: () => void;
  isGeneratingAI?: boolean;
}

export function PolicyEditor({
  value,
  onChange,
  placeholder,
  disabled = false,
  onUseDefault,
  onGenerateAI,
  isGeneratingAI = false,
}: PolicyEditorProps) {
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");

  const formatTextForPreview = (text: string) => {
    if (!text) return "";

    return text.split("\n").map((line, index) => {
      const trimmedLine = line.trim();

      // Handle headings (lines that start with text and end with colon or are short)
      if (
        trimmedLine &&
        (trimmedLine.endsWith(":") ||
          (trimmedLine.length < 50 && trimmedLine.split(" ").length <= 4))
      ) {
        return (
          <h3
            key={index}
            className="mt-4 mb-2 text-lg font-semibold text-gray-900 first:mt-0"
          >
            {trimmedLine}
          </h3>
        );
      }

      // Handle bullet points
      if (trimmedLine.startsWith("- ")) {
        return (
          <li key={index} className="mb-1 ml-4 text-gray-700">
            {trimmedLine.substring(2)}
          </li>
        );
      }

      // Handle numbered lists
      if (/^\d+\.\s/.test(trimmedLine)) {
        return (
          <li key={index} className="mb-1 ml-4 list-decimal text-gray-700">
            {trimmedLine.replace(/^\d+\.\s/, "")}
          </li>
        );
      }

      // Handle empty lines
      if (!trimmedLine) {
        return <br key={index} />;
      }

      // Handle regular paragraphs
      return (
        <p key={index} className="mb-3 leading-relaxed text-gray-700">
          {trimmedLine}
        </p>
      );
    });
  };

  return (
    <div className="space-y-4">
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as "edit" | "preview")}
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="edit" className="gap-2">
            <Edit3 className="h-4 w-4" />
            Edit
          </TabsTrigger>
          <TabsTrigger value="preview" className="gap-2">
            <Eye className="h-4 w-4" />
            Preview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="edit" className="space-y-4">
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            rows={12}
            className="resize-none font-mono text-base"
          />

          <div className="flex gap-2">
            {onUseDefault && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onUseDefault}
                disabled={disabled}
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Use Default Template
              </Button>
            )}

            {onGenerateAI && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onGenerateAI}
                disabled={disabled || isGeneratingAI}
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                {isGeneratingAI ? "Generating..." : "Generate with AI"}
              </Button>
            )}
          </div>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <div className="min-h-[300px] rounded-lg border bg-white p-6">
            {value ? (
              <div className="prose prose-sm max-w-none">
                {formatTextForPreview(value)}
              </div>
            ) : (
              <p className="text-gray-500 italic">No content to preview</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
