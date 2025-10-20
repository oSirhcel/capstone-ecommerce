/**
 * Client-side API functions for Risk Justification
 * These functions make HTTP requests and can be used in client components
 */

export interface RiskAssessmentListItem {
  id: number;
  userId: string | null;
  orderId: number | null;
  paymentIntentId: string | null;
  riskScore: number;
  decision: string;
  confidence: number;
  transactionAmount: number;
  currency: string;
  itemCount: number;
  storeCount: number;
  riskFactors: Array<{ factor: string; impact: number; description: string }>;
  aiJustification: string | null;
  justificationGeneratedAt: Date | null;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: Date;
  userEmail: string | null;
  userName: string | null;
  userLastName: string | null;
  username: string | null;
}

export interface RiskAssessmentsResponse {
  assessments: RiskAssessmentListItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export async function fetchRiskAssessments(params?: {
  decision?: Array<"allow" | "warn" | "deny">;
  storeId?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}): Promise<RiskAssessmentsResponse> {
  const qs = new URLSearchParams();
  if (params?.decision?.length) qs.set("decision", params.decision.join(","));
  if (params?.storeId) qs.set("storeId", params.storeId);
  if (params?.search) qs.set("search", params.search);
  if (params?.page) qs.set("page", String(params.page));
  if (params?.limit) qs.set("limit", String(params.limit));
  if (params?.sortBy) qs.set("sortBy", params.sortBy);
  if (params?.sortOrder) qs.set("sortOrder", params.sortOrder);

  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/risk-assessments?${qs.toString()}`);
  if (!res.ok) {
    throw new Error("Failed to fetch risk assessments");
  }
  return res.json() as Promise<RiskAssessmentsResponse>;
}

export async function regenerateJustification(assessmentId: number): Promise<{ justification: string }> {
  const res = await fetch(`/api/risk-assessment/${assessmentId}/justification`, { method: "POST" });
  if (!res.ok) {
    throw new Error("Failed to regenerate justification");
  }
  const data = await res.json();
  return { justification: data.justification as string };
}