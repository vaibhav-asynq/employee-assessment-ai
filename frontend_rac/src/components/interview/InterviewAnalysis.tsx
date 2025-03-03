import { StepperProvider } from "../ui/stepper";
import { StepperControls } from "./controls/StepperControls";
import InterviewAnalysisContent from "./InterviewAnalysisContent";
import { LogoutButton } from "../auth/LogoutButton";
import { useAuthStore } from "@/zustand/store/authStore";

export function InterviewAnalysis() {
  const { user } = useAuthStore();
  
  return (
    <>
      <StepperProvider>
        <div className="container mx-auto p-4">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                RAC Copilet
              </h1>
              {user && (
                <p className="text-sm text-gray-600 mt-1">
                  Logged in as: {user.username}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <LogoutButton />
              <StepperControls />
            </div>
          </div>
          <div>
            <InterviewAnalysisContent />
          </div>
        </div>
      </StepperProvider>
    </>
  );
}
