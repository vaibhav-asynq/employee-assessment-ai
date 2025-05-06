import { ActionWrapper } from "./ActionWrapper";
import { Button } from "@/components/ui/button";
import { useStepper } from "@/components/ui/stepper";
import { AnalysisDisplay } from "../analysis/AnalysisDisplay";
import { useInterviewDataStore } from "@/zustand/store/interviewDataStore";
import { Loader2 } from "lucide-react";

function DataAnalysis() {
  const { loadingSnapshot, fileId } = useInterviewDataStore();
  const { goToStep } = useStepper();

  if (!fileId) {
    return (
      <ActionWrapper>
        <div className="flex flex-col gap-3 items-center">
          <p>No file present, Can not perform analysis</p>
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

  if (loadingSnapshot) {
    return (
      <ActionWrapper>
        <div className="grid place-items-center w-full h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg font-medium text-gray-700">
              Loading latest snapshot...
            </p>
            <p className="text-sm text-gray-500 max-w-md text-center">
              Retrieving the most recent report data for this task.
            </p>
          </div>
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
