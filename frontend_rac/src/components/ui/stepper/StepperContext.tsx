"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { Step } from "./types";

type StepperContextType = {
  currentStep: number;
  totalSteps: number;
  nextStep: () => void;
  prevStep: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  goToStep: (step: number) => void;
  validateCurrentStep: () => Promise<boolean>;
  progress: number;
  setSteps: (steps: Step[]) => void;
  skipStep: () => void;
  resetStepper: () => void;
  getStepStatus: (stepNumber: number) => "completed" | "current" | "upcoming";
};

const StepperContext = createContext<StepperContextType | null>(null);

export const useStepper = () => {
  const context = useContext(StepperContext);
  if (!context) {
    throw new Error("useStepper must be used within a StepperProvider");
  }
  return context;
};

export const StepperProvider = ({
  children,
  steps: initialSteps = [],
  initialStep = 1,
  markVisitedAsCompleted = false,
}: {
  children: React.ReactNode;
  initialStep?: number;
  steps?: Step[];
  markVisitedAsCompleted?: boolean;
}) => {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [steps, setSteps] = useState<Step[]>(initialSteps);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const totalSteps = steps.length;
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === totalSteps;

  //TODO: use evenly
  const calculateProgressEvenly = useCallback(() => {
    if (totalSteps <= 1) return 0;
    const progress = ((currentStep - 1) / (totalSteps - 1)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  }, [currentStep, totalSteps]);

  const calculateProgress = useCallback(() => {
    if (totalSteps <= 1) return 0;

    const step = currentStep - 1;
    if (step <= 0) return 0;
    if (currentStep === totalSteps) return 100;

    const regularStepSize = 100 / totalSteps;
    const extendedStepSize = regularStepSize * 1.5;

    if (step === totalSteps - 1) {
      return 100 - extendedStepSize;
    } else {
      return extendedStepSize + regularStepSize * (step - 1);
    }
  }, [currentStep, totalSteps]);

  const validateCurrentStep = async () => {
    const step = steps[currentStep - 1];
    if (!step || step.isDisabled) return false;
    if (step.validationFn) {
      return await step.validationFn();
    }
    return true;
  };

  const nextStep = async () => {
    const isValid = await validateCurrentStep();
    if (!isValid) return;

    setCompletedSteps((prev) => new Set(prev.add(currentStep)));

    if (currentStep < totalSteps) {
      // Find next non-disabled step
      let nextStepIndex = currentStep + 1;
      while (
        nextStepIndex <= totalSteps &&
        steps[nextStepIndex - 1]?.isDisabled
      ) {
        nextStepIndex++;
      }
      if (nextStepIndex <= totalSteps) {
        setCurrentStep(nextStepIndex);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      // if not disabled
      let prevStepIndex = currentStep - 1;
      while (prevStepIndex >= 1 && steps[prevStepIndex - 1]?.isDisabled) {
        prevStepIndex--;
      }
      if (prevStepIndex >= 1) {
        if (!markVisitedAsCompleted) {
          setCompletedSteps((prev) => {
            const newCompleted = new Set(prev);
            for (let i = prevStepIndex; i <= currentStep; i++) {
              newCompleted.delete(i);
            }
            return newCompleted;
          });
        }
        setCurrentStep(prevStepIndex);
      }
    }
  };

  const goToStep = (step: number) => {
    //TODO: for goto Step It should depend on markVisitedAsCompleted
    if (step >= 1 && step <= totalSteps && !steps[step - 1]?.isDisabled) {
      setCurrentStep(step);
    }
  };

  const skipStep = () => {
    const currentStepData = steps[currentStep - 1];
    if (currentStepData?.isOptional) {
      nextStep();
    }
  };

  const resetStepper = () => {
    setCurrentStep(1);
    setCompletedSteps(new Set());
  };

  const getStepStatus = (stepNumber: number) => {
    if (completedSteps.has(stepNumber)) return "completed";
    if (stepNumber === currentStep) return "current";
    return "upcoming";
  };

  return (
    <StepperContext.Provider
      value={{
        currentStep,
        totalSteps,
        nextStep,
        prevStep,
        isFirstStep,
        isLastStep,
        goToStep,
        validateCurrentStep,
        progress: calculateProgress(),
        setSteps,
        skipStep,
        resetStepper,
        getStepStatus,
      }}
    >
      {children}
    </StepperContext.Provider>
  );
};
