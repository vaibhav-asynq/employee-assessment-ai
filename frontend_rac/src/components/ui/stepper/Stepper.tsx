"use client";

import { useEffect } from "react";
import { useStepper } from "./StepperContext";
import { Step } from "./types";
import { cn } from "@/lib/utils";
import { Button } from "../button";
import { Check, CircleDot } from "lucide-react";
import { Progress } from "../progress";

export type StepperProps = {
  steps: Step[];
  showNavigationButtons?: boolean;
  showTitles?: boolean;
  classNameContents?: string;
  className?: string;
  onFinish?: () => void;
};

export function Stepper({
  steps,
  showNavigationButtons = true,
  classNameContents = "",
  className = "",
  showTitles = true,
  ...props
}: StepperProps) {
  const {
    currentStep,
    nextStep,
    prevStep,
    isFirstStep,
    isLastStep,
    progress,
    setSteps,
    skipStep,
    getStepStatus,
  } = useStepper();

  useEffect(() => {
    setSteps(steps);
  }, [steps, setSteps]);

  const handleNext = async () => {
    if (isLastStep) {
      if (props.onFinish) {
        props.onFinish();
      }
    } else {
      nextStep();
    }
  };

  const currentStepData = steps[currentStep - 1];

  return (
    <div className={cn("w-full", className)}>
      {/* Navigation Buttons */}
      {showNavigationButtons && (
        <div className="flex justify-between mt-6">
          <Button
            onClick={prevStep}
            disabled={isFirstStep}
            className="bg-gray-500 hover:bg-gray-600"
          >
            Previous
          </Button>
          <div className="flex gap-2">
            {currentStepData?.isOptional && (
              <Button variant="outline" onClick={skipStep}>
                Skip
              </Button>
            )}
            <Button onClick={handleNext}>
              {isLastStep ? "Finish" : "Next"}
            </Button>
          </div>
        </div>
      )}

      {/* Stepper Navigation */}
      <div
        className={cn(
          "bg-transparent relative flex items-start justify-between w-full mt-4",
        )}
      >
        <div className="absolute top-2 left-0 w-full">
          <Progress value={progress} className="w-full h-[4px]" />
        </div>
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const status = getStepStatus(stepNumber);
          return (
            <div key={index} className="relative flex flex-col w-full">
              {/* Step Icon */}
              <div
                className={cn(
                  "z-10 rounded-full size-[19px]",
                  "self-center",
                  stepNumber === 1 && "self-start",
                  stepNumber === steps.length && "self-end",
                  status === "completed" ? "bg-primary" : "bg-white",
                  "transition",
                  "grid place-items-center",
                )}
              >
                {status === "completed" ? (
                  <Check
                    strokeWidth={3}
                    className="size-[16px] rounded-full text-white"
                  />
                ) : (
                  <CircleDot
                    className={cn(
                      "size-full",
                      status === "current" ? "text-primary" : "text-primary/50",
                    )}
                  />
                )}
              </div>

              {/* Step Title */}
              {showTitles && (
                <span
                  className={cn(
                    "mt-2 text-sm font-medium",
                    index === 0
                      ? "text-start"
                      : index === steps.length - 1
                        ? "text-right"
                        : "text-center",

                    ["completed", "current"].includes(status)
                      ? "text-slate-900"
                      : "text-gray-400",
                  )}
                >
                  {step.title}
                  {/* {status}, {progress}, {step.title}, {currentStep} */}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <div className={cn("mb-14", classNameContents)}>
        {currentStepData?.content}
      </div>
    </div>
  );
}
