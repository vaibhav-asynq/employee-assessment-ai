import { useInterviewAnalysis } from "@/components/providers/InterviewAnalysisContext";
import React, { useEffect } from "react";
import { ActionWrapper } from "./ActionWrapper";
import { Button } from "@/components/ui/button";
import { useStepper } from "@/components/ui/stepper";
import { AnalysisDisplay } from "../analysis/AnalysisDisplay";

function DataAnalysis() {
  const { file, selectedPath, setSelectedPath } = useInterviewAnalysis();
  const { goToStep } = useStepper();

  useEffect(() => {
    if (!selectedPath) {
      setSelectedPath("base-edit");
    }
  }, [selectedPath, setSelectedPath]);

  if (!file) {
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
