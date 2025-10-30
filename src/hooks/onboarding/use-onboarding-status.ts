import { useQuery } from "@tanstack/react-query";

export interface OnboardingStatus {
  hasStore: boolean;
  storeId?: string;
  progress: number;
  completedSteps: string[];
  nextSteps: string[];
  details?: {
    storeName?: string;
    storeDescription?: string;
    hasSettings?: boolean;
    productCount?: number;
  };
}

async function fetchOnboardingStatus(): Promise<OnboardingStatus> {
  const res = await fetch("/api/ai/onboarding-status");
  if (!res.ok) {
    const err = (await res.json()) as { error?: string };
    throw new Error(err.error ?? "Failed to fetch onboarding status");
  }
  return res.json() as Promise<OnboardingStatus>;
}

export function useOnboardingStatus() {
  return useQuery({
    queryKey: ["onboarding-status"],
    queryFn: fetchOnboardingStatus,
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: true,
  });
}

