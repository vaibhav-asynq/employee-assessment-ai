"use client";
import { Button } from "@/components/ui/button";
import { useStepper } from "@/components/ui/stepper";
import React from "react";

export function StepperControls(props: {}) {
  const { nextStep, prevStep, isLastStep, isFirstStep } = useStepper();
  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        onClick={() => prevStep()}
        disabled={isFirstStep}
      >
        Previous
      </Button>
      <Button
        onClick={() => nextStep()}
        // disabled={activeStep === getTotalSteps() || !analysisData}
        disabled={isLastStep}
      >
        {isLastStep ? "Finish" : "Next"}
      </Button>
    </div>
  );
}
