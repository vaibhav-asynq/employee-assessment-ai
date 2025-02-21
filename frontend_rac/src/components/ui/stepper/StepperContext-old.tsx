"use client";
import React, { createContext, useContext, useState } from "react";

type StepperContextType = {
  currentStep: number;
  nextStep: () => void;
  prevStep: () => void;
  setCurrentStep: (step: number) => void;
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
  initialStep = 0,
}: {
  children: React.ReactNode;
  initialStep?: number;
}) => {
  const [currentStep, setCurrentStep] = useState(initialStep);

  const nextStep = () => {
    setCurrentStep((prev) => prev + 1);
  };

  const prevStep = () => {
    setCurrentStep((prev) => (prev > 0 ? prev - 1 : 0));
  };

  return (
    <StepperContext.Provider
      value={{ currentStep, nextStep, prevStep, setCurrentStep }}
    >
      {children}
    </StepperContext.Provider>
  );
};
