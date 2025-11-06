"use client";

import { useOnboardingStatus } from "@/hooks/onboarding/use-onboarding-status";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface StepConfig {
  key: string;
  label: string;
  route?: string;
}

const STEP_CONFIGS: Record<string, StepConfig> = {
  storeCreated: {
    key: "storeCreated",
    label: "Store created",
  },
  storeDetails: {
    key: "storeDetails",
    label: "Add store details",
    route: "/admin/settings/store",
  },
  taxConfigured: {
    key: "taxConfigured",
    label: "Configure tax settings",
    route: "/admin/settings/tax",
  },
  shippingConfigured: {
    key: "shippingConfigured",
    label: "Set up shipping",
    route: "/admin/settings/shipping",
  },
  paymentConfigured: {
    key: "paymentConfigured",
    label: "Connect payment method",
    route: "/admin/settings/payments",
  },
  policiesCreated: {
    key: "policiesCreated",
    label: "Create store policies",
    route: "/admin/settings/store",
  },
  firstProductAdded: {
    key: "firstProductAdded",
    label: "Add your first product",
    route: "/admin/products/add",
  },
};

const ALL_STEPS = [
  "storeCreated",
  "storeDetails",
  "taxConfigured",
  "shippingConfigured",
  "paymentConfigured",
  "policiesCreated",
  "firstProductAdded",
] as const;

export function OnboardingTracker() {
  const { data, isLoading, error } = useOnboardingStatus();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-6">
          <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return null;
  }

  // Auto-hide when onboarding is 100% complete
  if (data.progress >= 100) {
    return null;
  }

  const completedStepsSet = new Set(data.completedSteps);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Complete your store setup</CardTitle>
            <CardDescription>
              Finish setting up your store to start selling
            </CardDescription>
          </div>
          <div className="text-right" aria-label={`${data.progress}% complete`}>
            <div className="text-2xl font-bold">{data.progress}%</div>
            <div className="text-muted-foreground text-xs">Complete</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress
          value={data.progress}
          className="h-2"
          aria-label={`Onboarding progress: ${data.progress}%`}
        />
        <div className="space-y-2" role="list" aria-label="Onboarding steps">
          {ALL_STEPS.map((stepKey) => {
            const config = STEP_CONFIGS[stepKey as keyof typeof STEP_CONFIGS];
            const isCompleted = completedStepsSet.has(stepKey);
            const hasRoute = !!config.route;

            return (
              <div
                key={stepKey}
                role="listitem"
                className={cn(
                  "flex items-center gap-3 py-2",
                  isCompleted && "opacity-60",
                )}
              >
                {isCompleted ? (
                  <CheckCircle2
                    className="text-primary h-5 w-5 shrink-0"
                    aria-label={`${config.label} completed`}
                  />
                ) : (
                  <Circle
                    className="text-muted-foreground h-5 w-5 shrink-0"
                    aria-label={`${config.label} not completed`}
                  />
                )}
                <span
                  className={cn(
                    "flex-1 text-sm",
                    isCompleted
                      ? "text-muted-foreground line-through"
                      : "text-foreground",
                  )}
                >
                  {config.label}
                </span>
                {!isCompleted && hasRoute && (
                  <Button asChild variant="ghost" size="sm">
                    <Link
                      href={config.route ?? ""}
                      className="flex items-center gap-1"
                      aria-label={`Complete ${config.label}`}
                    >
                      Complete
                      <ArrowRight className="h-3 w-3" aria-hidden="true" />
                    </Link>
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
