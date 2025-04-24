import { AuthStatus } from "../auth/AuthStatus";
import { AppSidebar } from "../sidebar/AppSidebar";
import { SidebarTrigger } from "../ui/sidebar";
import { StepperProvider } from "../ui/stepper";
import { StepperControls } from "./controls/StepperControls";
import InterviewAnalysisContent from "./InterviewAnalysisContent";
import { useUser } from "@clerk/nextjs";

export function InterviewAnalysis() {
  const { user } = useUser();

  return (
    <>
      <StepperProvider>
        <div className="flex">
          <AppSidebar />
          <div className="flex-1 ml-[70px] p-4">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  RAC Copilot
                </h1>
                {user && (
                  <p className="text-sm text-gray-600 mt-1">
                    Logged in as: {user.primaryEmailAddress?.emailAddress}
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-4">
                <AuthStatus />
                <StepperControls />
              </div>
            </div>
            <div>
              <InterviewAnalysisContent />
            </div>
          </div>
        </div>
      </StepperProvider>
    </>
  );
}
