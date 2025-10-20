"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { regenerateJustification } from "@/lib/api/risk-justification";
import { useState } from "react";

// Component to render AI justification with proper formatting
function AIJustificationText({ text }: { text: string }) {
  if (!text)
    return (
      <span className="text-muted-foreground">No justification generated.</span>
    );

  // Split text into lines and process each line
  const lines = text.split("\n");

  return (
    <div className="space-y-2">
      {lines.map((line, index) => {
        // Handle empty lines
        if (line.trim() === "") {
          return <br key={index} />;
        }

        // Handle bullet points (lines starting with *, -, or •)
        if (/^[\s]*[\*\-\•]\s/.test(line)) {
          const content = line.replace(/^[\s]*[\*\-\•]\s/, "");
          return (
            <div key={index} className="ml-4 flex items-start gap-2">
              <span className="text-muted-foreground mt-1 text-xs">•</span>
              <span className="flex-1 text-xs">
                {formatInlineText(content)}
              </span>
            </div>
          );
        }

        // Handle numbered lists
        if (/^[\s]*\d+\.\s/.test(line)) {
          const match = line.match(/^([\s]*\d+\.)\s(.*)$/);
          if (match) {
            const [, number, content] = match;
            return (
              <div key={index} className="ml-4 flex items-start gap-2">
                <span className="text-muted-foreground text-xs font-medium">
                  {number}
                </span>
                <span className="flex-1 text-xs">
                  {formatInlineText(content)}
                </span>
              </div>
            );
          }
        }

        // Handle headers (lines with ## or ###)
        if (/^[\s]*#{2,3}\s/.test(line)) {
          const isH2 = line.startsWith("##");
          const content = line.replace(/^[\s]*#{2,3}\s/, "");
          const HeadingTag = isH2 ? "h3" : "h4";
          return (
            <HeadingTag
              key={index}
              className={`text-foreground mt-4 font-bold ${isH2 ? "text-xl" : "text-lg"}`}
            >
              {content}
            </HeadingTag>
          );
        }

        // Handle code blocks (lines starting with ```
        if (/^[\s]*```/.test(line)) {
          return (
            <div
              key={index}
              className="bg-muted rounded-md border p-3 font-mono text-xs"
            >
              <code>{line.replace(/^[\s]*```/, "")}</code>
            </div>
          );
        }

        // Regular paragraphs
        return (
          <p key={index} className="text-xs leading-relaxed">
            {formatInlineText(line)}
          </p>
        );
      })}
    </div>
  );
}

// Helper function to format inline text (bold, italic, etc.)
function formatInlineText(text: string) {
  const parts = [];
  let currentIndex = 0;

  // Handle bold text (**text** or __text__)
  const boldRegex = /\*\*(.*?)\*\*|__(.*?)__/g;
  let match;

  while ((match = boldRegex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > currentIndex) {
      parts.push(text.slice(currentIndex, match.index));
    }

    // Add the bold text
    const boldContent = match[1] || match[2];
    parts.push(
      <strong
        key={`bold-${match.index}`}
        className="text-foreground font-semibold"
      >
        {boldContent}
      </strong>,
    );

    currentIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (currentIndex < text.length) {
    const remainingText = text.slice(currentIndex);

    // Handle inline code (`code`)
    const codeRegex = /`([^`]+)`/g;
    let codeMatch;
    let codeIndex = 0;

    while ((codeMatch = codeRegex.exec(remainingText)) !== null) {
      // Add text before the code match
      if (codeMatch.index > codeIndex) {
        parts.push(remainingText.slice(codeIndex, codeMatch.index));
      }

      // Add the inline code
      parts.push(
        <code
          key={`code-${currentIndex + codeMatch.index}`}
          className="bg-muted rounded px-1 py-0.5 font-mono text-[10px]"
        >
          {codeMatch[1]}
        </code>,
      );

      codeIndex = codeMatch.index + codeMatch[0].length;
    }

    // Handle italic text (*text* or _text_) - but not if it's already part of code
    const italicRegex =
      /(?<!\*)\*(?!\*)([^*]+)\*(?!\*)|(?<!_)_(?!_)([^_]+)_(?!_)/g;
    let italicMatch;
    let italicIndex = 0;

    while ((italicMatch = italicRegex.exec(remainingText)) !== null) {
      // Add text before the italic match
      if (italicMatch.index > italicIndex) {
        parts.push(remainingText.slice(italicIndex, italicMatch.index));
      }

      // Add the italic text
      const italicContent = italicMatch[1] || italicMatch[2];
      parts.push(
        <em
          key={`italic-${currentIndex + italicMatch.index}`}
          className="text-foreground italic"
        >
          {italicContent}
        </em>,
      );

      italicIndex = italicMatch.index + italicMatch[0].length;
    }

    // Add remaining text after formatting processing
    if (italicIndex < remainingText.length) {
      parts.push(remainingText.slice(italicIndex));
    }
  }

  return parts.length > 0 ? parts : text;
}

export default function RiskAssessmentDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["risk-assessment", id],
    queryFn: async () => {
      const res = await fetch(`/api/risk-assessment/${id}`);
      if (!res.ok) throw new Error("Failed to load assessment");
      return res.json() as Promise<{
        id: number;
        decision: string;
        riskScore: number;
        confidence: number;
        transactionAmount: number;
        riskFactors: Array<{
          factor: string;
          impact: number;
          description: string;
        }>;
        aiJustification: string | null;
        justificationGeneratedAt: string | null;
        ipAddress: string | null;
        createdAt: string;
        userEmail: string | null;
        userName: string | null;
        userLastName: string | null;
        username: string | null;
      }>;
    },
  });

  const regen = useMutation({
    mutationFn: () => regenerateJustification(id),
    onSuccess: async () => {
      setError(null);
      await refetch();
      await qc.invalidateQueries({ queryKey: ["risk-assessments"] });
    },
    onError: () => setError("Failed to regenerate justification"),
  });

  if (isLoading || !data) {
    return <div className="text-muted-foreground text-sm">Loading…</div>;
  }

  const variant =
    data.decision === "deny"
      ? "destructive"
      : data.decision === "warn"
        ? "secondary"
        : "default";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/risk-assessments">
            <Button variant="outline" size="sm">
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Assessment #{data.id}</h1>
          <Badge variant={variant as any}>{data.decision.toUpperCase()}</Badge>
        </div>
        <Button onClick={() => regen.mutate()} disabled={regen.isPending}>
          {regen.isPending ? "Regenerating…" : "Regenerate Justification"}
        </Button>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>AI Justification</span>
              {data.aiJustification && (
                <Badge variant="outline" className="text-xs">
                  AI Generated
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Generated{" "}
              {data.justificationGeneratedAt
                ? new Date(data.justificationGeneratedAt).toLocaleString()
                : "not yet"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/30 rounded-lg border p-4">
              <AIJustificationText text={data.aiJustification || ""} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
            <CardDescription>Key risk details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">User:</span>{" "}
                {data.userName || data.userEmail || data.username ? (
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {[data.userName, data.userLastName]
                        .filter(Boolean)
                        .join(" ") ||
                        data.username ||
                        "Unknown"}
                    </span>
                    {data.userEmail && (
                      <span className="text-muted-foreground text-xs">
                        {data.userEmail}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-muted-foreground">Guest</span>
                )}
              </div>
              <div>
                <span className="text-muted-foreground">Score:</span>{" "}
                <span className="font-medium">{data.riskScore}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Confidence:</span>{" "}
                {data.confidence}%
              </div>
              <div>
                <span className="text-muted-foreground">Amount:</span> $
                {(data.transactionAmount / 100).toFixed(2)}
              </div>
              <div>
                <span className="text-muted-foreground">IP:</span>{" "}
                {data.ipAddress ?? "-"}
              </div>
              <div>
                <span className="text-muted-foreground">Created:</span>{" "}
                {new Date(data.createdAt).toLocaleString()}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Risk Factors</CardTitle>
            <CardDescription>Contributors to the risk score</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {data.riskFactors.map((f, idx) => (
                <li key={idx} className="rounded-md border p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{f.factor}</span>
                    <Badge variant="outline">+{f.impact}</Badge>
                  </div>
                  <div className="text-muted-foreground mt-1">
                    {f.description}
                  </div>
                </li>
              ))}
              {data.riskFactors.length === 0 && (
                <li className="text-muted-foreground">No factors recorded.</li>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
