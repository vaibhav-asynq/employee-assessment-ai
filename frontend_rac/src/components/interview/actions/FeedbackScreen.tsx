"use client";
import { useEffect } from "react";
import { ActionWrapper } from "./ActionWrapper";
import { useInterviewDataStore } from "@/zustand/store/interviewDataStore";
import { useStepper } from "@/components/ui/stepper";
import { ManualReportStakeholderDisplay } from "../analysis/manual-report/ManualReportStakeholderDisplay";

export function FeedbackScreen() {
  const { loadingSnapshot } = useInterviewDataStore();

  const { nextStep } = useStepper();

  useEffect(() => {
    if (loadingSnapshot) {
      nextStep();
    }
  }, [loadingSnapshot, nextStep]);

  return (
    <ActionWrapper>
      <div className="pr-4 max-h-[80vh] overflow-y-auto pb-8">
        <ManualReportStakeholderDisplay />
      </div>
    </ActionWrapper>
  );
}
