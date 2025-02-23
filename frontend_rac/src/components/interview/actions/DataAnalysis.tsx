import React from "react";
import { ActionWrapper } from "./ActionWrapper";
import { Button } from "@/components/ui/button";
import { useStepper } from "@/components/ui/stepper";
import { AnalysisDisplay } from "../analysis/AnalysisDisplay";
import { useInterviewDataStore } from "@/zustand/store/interviewDataStore";

function DataAnalysis() {
  const fileId = useInterviewDataStore((state) => state.fileId);

  const { goToStep } = useStepper();

  if (!fileId) {
    return (
      <ActionWrapper>
        <div className="flex flex-col gap-3 items-center">
          <p>Can not perform analysis</p>
          <Button
            onClick={(e) => {
              e.preventDefault();
              goToStep(1);
            }}
          >
            Upload a file first for analysis
          </Button>
        </div>
      </ActionWrapper>
    );
  }

  return (
    <ActionWrapper>
      <AnalysisDisplay />
    </ActionWrapper>
  );
}

export default DataAnalysis;
