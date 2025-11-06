"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";

interface CollapsiblePolicySectionProps {
  title: string;
  description: string;
  isRequired?: boolean;
  isFilled: boolean;
  children: React.ReactNode;
  onAdd?: () => void;
}

export function CollapsiblePolicySection({
  title,
  description,
  isRequired = false,
  isFilled,
  children,
  onAdd,
}: CollapsiblePolicySectionProps) {
  const [isExpanded, setIsExpanded] = useState(isFilled || isRequired);

  const handleToggle = () => {
    if (!isFilled && !isRequired && onAdd) {
      onAdd();
    }
    setIsExpanded(!isExpanded);
  };

  return (
    <Card className="border-2 shadow-sm">
      <CardHeader
        className="cursor-pointer transition-colors hover:bg-gray-50"
        onClick={handleToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {!isRequired && !isFilled ? (
              <ChevronRight className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                {title}
                {isRequired && (
                  <Badge variant="destructive" className="text-xs">
                    Required
                  </Badge>
                )}
                {!isRequired && isFilled && (
                  <Badge variant="secondary" className="text-xs">
                    Optional
                  </Badge>
                )}
                {!isRequired && !isFilled && (
                  <Badge variant="outline" className="text-xs">
                    Optional
                  </Badge>
                )}
              </CardTitle>
              <p className="mt-1 text-sm text-gray-600">{description}</p>
            </div>
          </div>

          {!isRequired && !isFilled && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onAdd?.();
                setIsExpanded(true);
              }}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add {title}
            </Button>
          )}
        </div>
      </CardHeader>

      {isExpanded && <CardContent>{children}</CardContent>}
    </Card>
  );
}
