import { cn } from "@/lib/utils";
import { GenerateFullReport } from "./GenerateFullReport";
import { GenerateCompetencies } from "./GenerateCompetencies";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { useAnalysisStore } from "@/zustand/store/analysisStore";

function ActionsBar() {
  const resetAnalysisToOriginal = useAnalysisStore(
    (state) => state.resetAnalysisToOriginal,
  );
  const [isResetting, setIsResetting] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  const handleReset = async () => {
    setIsResetting(true);
    console.log("resetting");
    resetAnalysisToOriginal();
    setIsResetting(false);
    setIsAlertOpen(false);
  };

  return (
    <div className="flex justify-between items-center">
      <div className={cn("flex gap-4")}>
        <GenerateFullReport />
        <GenerateCompetencies />
      </div>
      <div>
        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
          <AlertDialogTrigger asChild>
            <Button size="sm" variant="secondary" disabled={isResetting}>
              <div className="flex items-center gap-1">
                <RotateCcw size={14} />
                <span>Reset</span>
              </div>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset Analysis</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to reset the interview analysis? This will
                revert all changes to the original state.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isResetting}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  handleReset();
                }}
                disabled={isResetting}
                className="bg-destructive text-destructive-foreground hover:bg-red-600"
              >
                {isResetting ? "Resetting..." : "Reset Analysis"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

export default ActionsBar;
