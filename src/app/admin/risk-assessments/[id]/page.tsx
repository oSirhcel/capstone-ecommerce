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
            <CardTitle>AI Justification</CardTitle>
            <CardDescription>
              Generated{" "}
              {data.justificationGeneratedAt
                ? new Date(data.justificationGeneratedAt).toLocaleString()
                : "not yet"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm leading-6 whitespace-pre-wrap">
              {data.aiJustification ?? "No justification generated."}
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
