"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface PolicyViewerProps {
  title: string;
  content: string;
  storeName: string;
  storeSlug: string;
  lastUpdated?: string;
}

export function PolicyViewer({
  title,
  content,
  storeName,
  storeSlug,
  lastUpdated,
}: PolicyViewerProps) {
  const formatTextForDisplay = (text: string) => {
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
            className="mt-6 mb-3 text-xl font-semibold text-gray-900 first:mt-0"
          >
            {trimmedLine}
          </h3>
        );
      }

      // Handle bullet points
      if (trimmedLine.startsWith("- ")) {
        return (
          <li key={index} className="mb-2 ml-6 text-gray-700">
            {trimmedLine.substring(2)}
          </li>
        );
      }

      // Handle numbered lists
      if (/^\d+\.\s/.test(trimmedLine)) {
        return (
          <li key={index} className="mb-2 ml-6 list-decimal text-gray-700">
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
        <p key={index} className="mb-4 leading-relaxed text-gray-700">
          {trimmedLine}
        </p>
      );
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href={`/stores/${storeSlug}`}>
            <Button variant="ghost" className="mb-4 gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to {storeName}
            </Button>
          </Link>

          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
            <p className="mt-2 text-gray-600">
              {storeName} • {lastUpdated && `Last updated: ${lastUpdated}`}
            </p>
          </div>
        </div>

        {/* Policy Content */}
        <div className="mx-auto max-w-4xl">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-center text-2xl">{title}</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-lg max-w-none">
              <div className="space-y-4">
                {content ? (
                  formatTextForDisplay(content)
                ) : (
                  <div className="py-12 text-center">
                    <p className="text-gray-500">
                      This policy is not available at the moment.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <Link href={`/stores/${storeSlug}`}>
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Return to Store
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
