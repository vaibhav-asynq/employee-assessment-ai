"use client";
import { Button } from "@/components/ui/button";
import { useStepper } from "@/components/ui/stepper";
import React from "react";
import { Download } from "lucide-react";

export function StepperControls(props: {}) {
  const handleDownload = () => {
    // Create a link to download the file
    const link = document.createElement('a');
    link.href = '/Data%20Inputs/Developmental%20Suggestions%20&%20Resources.xlsx';
    link.download = 'Developmental Suggestions & Resources.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const { nextStep, prevStep, isLastStep, isFirstStep } = useStepper();
  return (
    <div className="flex gap-2 items-center">
      <Button
        variant="outline"
        onClick={handleDownload}
        className="flex items-center gap-2"
      >
        <Download className="h-4 w-4" />
        Download Development Resource
      </Button>
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
