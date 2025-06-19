"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StepperProps extends React.HTMLAttributes<HTMLDivElement> {
  steps: {
    id: string;
    label: string;
    description?: string;
  }[];
  activeStep: number;
  onStepClick?: (stepIndex: number) => void;
  orientation?: "horizontal" | "vertical";
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  showLabels?: boolean;
}

export function Stepper({
  steps,
  activeStep,
  onStepClick,
  orientation = "horizontal",
  variant = "default",
  size = "default",
  showLabels = true,
  className,
  ...props
}: StepperProps) {
  return (
    <div
      className={cn(
        "flex",
        orientation === "horizontal" ? "flex-row" : "flex-col",
        className
      )}
      {...props}
      role="navigation"
      aria-label="Course creation steps"
    >
      {steps.map((step, index) => {
        const isActive = index === activeStep;
        const isCompleted = index < activeStep;
        const isClickable = onStepClick !== undefined;
        
        return (
          <React.Fragment key={step.id}>
            <div
              className={cn(
                "flex",
                orientation === "horizontal" ? "flex-col items-center" : "flex-row items-center",
                "gap-2",
                {
                  "cursor-pointer": isClickable,
                },
                isActive && "font-medium",
              )}
              onClick={() => isClickable && onStepClick(index)}
              aria-current={isActive ? "step" : undefined}
            >
              <div
                className={cn(
                  "flex items-center justify-center rounded-full transition-colors",
                  {
                    "h-8 w-8": size === "default",
                    "h-6 w-6": size === "sm",
                    "h-10 w-10": size === "lg",
                    "bg-primary text-primary-foreground": isActive && variant === "default",
                    "border-2 border-primary": isActive && variant === "outline",
                    "bg-muted text-muted-foreground": !isActive && !isCompleted,
                    "bg-primary/20 text-primary": isCompleted && variant === "default",
                    "border-2 border-primary/50": isCompleted && variant === "outline",
                  }
                )}
              >
                {isCompleted ? (
                  <Check className={cn("h-4 w-4", size === "lg" && "h-5 w-5")} />
                ) : (
                  <span className="text-sm">{index + 1}</span>
                )}
              </div>
              {showLabels && (
                <div className={cn(
                  "flex flex-col",
                  orientation === "horizontal" ? "text-center" : "ml-2",
                  "text-sm"
                )}>
                  <span className={cn(
                    "font-medium",
                    isActive ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {step.label}
                  </span>
                  {step.description && (
                    <span className="text-muted-foreground text-xs mt-0.5 hidden sm:inline">
                      {step.description}
                    </span>
                  )}
                </div>
              )}
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "flex-1",
                  orientation === "horizontal"
                    ? "mx-2 h-[1px] self-start mt-4" 
                    : "my-2 w-[1px] self-start ml-4",
                  isCompleted ? "bg-primary" : "bg-muted"
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
