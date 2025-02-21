"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, Circle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useStepper } from "./StepperContext";

export type Step = {
  title: string;
  content: React.ReactNode;
};
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
  const { setCurrentStep, currentStep, nextStep, prevStep } = useStepper();
  const [progress, setProgress] = useState(0);

  //INFO: onFinish is only required if showNavigation is enabled.
  const handleNext = () => {
    if (currentStep === steps.length - 1) {
      if (props.onFinish) {
        props.onFinish();
      } else {
        setCurrentStep(0);
      }
    }
    if (currentStep < steps.length - 1) {
      nextStep();
    }
  };

  useEffect(() => {
    const calculateProgress = (_step: number) => {
      const totalSteps = steps.length;
      const step = _step - 1;

      if (step <= 0) return 0;
      if (step === totalSteps - 1) return 100;

      const regularStepSize = 100 / totalSteps;
      const extendedStepSize = regularStepSize * 1.5;

      if (step === 1) {
        return extendedStepSize;
      } else {
        return extendedStepSize + regularStepSize * (step - 1);
      }
    };
    setProgress(calculateProgress(currentStep + 1));
  }, [currentStep, steps.length]);

  const currentStepData = steps[currentStep];
  return (
    <div className={cn("w-full", className)}>
      {/* Navigation Buttons */}
      {showNavigationButtons && (
        <div className="flex justify-between mt-6">
          <Button
            onClick={prevStep}
            disabled={currentStep === 0}
            className="bg-gray-500 hover:bg-gray-600"
          >
            Previous
          </Button>
          <Button onClick={handleNext}>
            {currentStep === steps.length - 1 ? "Finish" : "Next"}
          </Button>
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
        {steps.map((step, index) => (
          <div key={index} className="relative flex flex-col w-full">
            {/* Step Icon */}
            <div
              className={cn(
                "z-10 rounded-full size-[19px]",
                index === 0
                  ? "self-start"
                  : index === steps.length - 1
                    ? "self-end"
                    : "self-center",
                index < currentStep ? "bg-primary" : "bg-white",
                "transition",
                "grid place-items-center",
              )}
            >
              {index < currentStep ? (
                <Check
                  strokeWidth={3}
                  className="size-[16px] rounded-full text-white"
                />
              ) : (
                <Circle
                  className={cn(
                    "size-full",
                    index === currentStep ? "text-primary" : "text-primary/50",
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

                  index <= currentStep ? "text-slate-900" : "text-gray-400",
                )}
              >
                {step.title}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className={cn("mb-14", classNameContents)}>
        {currentStepData.content}
      </div>
    </div>
  );
}
