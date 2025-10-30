"use client";

import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ONBOARDING_STEP_CONFIGS } from "@/lib/ai/onboarding-step-configs";
import type { OnboardingStatus } from "@/hooks/onboarding/use-onboarding-status";

interface OnboardingStatusCardProps {
  data: OnboardingStatus;
}

export function OnboardingStatusCard({ data }: OnboardingStatusCardProps) {
  const router = useRouter();

  const completedStepsSet = new Set(data.completedSteps);
  const nextSteps = data.nextSteps.slice(0, 3); // Show up to 3 next steps

  const handleNavigate = (route: string) => {
    router.push(route);
  };

  return (
    <div className="w-full rounded-lg border bg-card p-3 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Store Setup Progress</h3>
          <p className="text-muted-foreground text-xs">
            {data.progress}% complete • {data.nextSteps.length} steps remaining
          </p>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold">{data.progress}%</div>
        </div>
      </div>
      
      <Progress 
        value={data.progress} 
        className="mb-3 h-1.5" 
        aria-label={`Onboarding progress: ${data.progress}%`}
      />

      <div className="space-y-1.5">
        {nextSteps.map((stepKey) => {
          const stepConfig = ONBOARDING_STEP_CONFIGS[stepKey];
          if (!stepConfig) return null;

          const isCompleted = completedStepsSet.has(stepKey);
          const hasRoute = !!stepConfig.route;

          return (
            <div
              key={stepKey}
              className={cn(
                "flex items-center gap-2 py-1",
                isCompleted && "opacity-60",
              )}
            >
              {isCompleted ? (
                <CheckCircle2 
                  className="text-primary h-4 w-4 shrink-0" 
                  aria-label={`${stepConfig.label} completed`}
                />
              ) : (
                <Circle 
                  className="text-muted-foreground h-4 w-4 shrink-0" 
                  aria-label={`${stepConfig.label} not completed`}
                />
              )}
              <span
                className={cn(
                  "flex-1 text-xs",
                  isCompleted
                    ? "text-muted-foreground line-through"
                    : "text-foreground",
                )}
              >
                {stepConfig.label}
              </span>
              {!isCompleted && hasRoute && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => handleNavigate(stepConfig.route!)}
                  aria-label={`Complete ${stepConfig.label}`}
                >
                  Go
                  <ArrowRight className="ml-1 h-3 w-3" aria-hidden="true" />
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {data.nextSteps.length > 3 && (
        <p className="text-muted-foreground mt-2 text-xs">
          +{data.nextSteps.length - 3} more steps
        </p>
      )}
    </div>
  );
}

