import { InterviewAnalysisProvider } from "../providers/InterviewAnalysisContext";
import { StepperProvider } from "../ui/stepper";
import { StepperControls } from "./controls/StepperControls";
import InterviewAnalysisContent from "./InterviewAnalysisContent";

export function InterviewAnalysis() {
  return (
    <>
      <InterviewAnalysisProvider>
        <StepperProvider>
          <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold tracking-tight">
                Interview Analysis Dashboard
              </h1>
              <StepperControls />
            </div>
            <div>
              <InterviewAnalysisContent />
            </div>
          </div>
        </StepperProvider>
      </InterviewAnalysisProvider>
    </>
  );
}
