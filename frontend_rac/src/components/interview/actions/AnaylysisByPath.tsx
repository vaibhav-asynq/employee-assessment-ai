import { useInterviewAnalysis } from "@/components/providers/InterviewAnalysisContext";
import { ActionWrapper } from "./ActionWrapper";
import { Button } from "@/components/ui/button";
import { useStepper } from "@/components/ui/stepper";
import { FullReport } from "../analysis/full-report/FullReport";
import { AiPargraph } from "../analysis/ai-paragraph/AiPargraph";
import { AiCompetencies } from "../analysis/ai-competencies/AiCompetencies";

export function AnaylysisByPath() {
  const { selectedPath, file } = useInterviewAnalysis();
  const { prevStep, goToStep } = useStepper();
  if (!selectedPath) {
    return (
      <ActionWrapper>
        <div className="flex flex-col gap-3 items-center">
          <p>Can not perform analysis</p>
          <Button
            onClick={(e) => {
              e.preventDefault();
              if (!file) {
                goToStep(1);
              } else {
                prevStep();
              }
            }}
          >
            {!file ? "Upload a file first for analysis" : "Select a path first"}
          </Button>
        </div>
      </ActionWrapper>
    );
  }

  if (selectedPath === 1) {
    return (
      <ActionWrapper>
        <AiPargraph />
      </ActionWrapper>
    );
  }
  if (selectedPath === 2) {
    return (
      <ActionWrapper>
        <AiCompetencies />
      </ActionWrapper>
    );
  }
  if (selectedPath === 3) {
    return (
      <ActionWrapper>
        <FullReport />
      </ActionWrapper>
    );
  }
  return (
    <ActionWrapper>
      <div className="flex flex-col gap-3 items-center">
        <p className="text-red-600">
          Component corrupted! Please refresh or restart the process
        </p>
      </div>
    </ActionWrapper>
  );
}
