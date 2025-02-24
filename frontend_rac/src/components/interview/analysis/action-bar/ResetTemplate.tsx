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
import { useUserPreferencesStore } from "@/zustand/store/userPreferencesStore";
import { parseHierarchicalPath } from "@/lib/types/types.user-preferences";

export function ResetTemplate() {
  const selectedPath = useUserPreferencesStore((state) => state.selectedPath);
  const availablePaths = useUserPreferencesStore(
    (state) => state.availablePaths,
  );
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

  const getName = () => {
    let name = <span className="italic">Invalid Data</span>;
    const { parentId: parsedParentId, childId: parsedChildId } =
      parseHierarchicalPath(selectedPath);
    const parentTab = availablePaths.find((tab) => tab.id === parsedParentId);
    if (!parentTab) {
      return name;
    }
    name = <span className="underline">{parentTab.name}</span>;
    return name;
    //INFO: idts below is necessary
    if (parsedChildId) {
      const childTab = parentTab.child?.find(
        (child) => child.id === parsedChildId,
      );
      if (!childTab) {
        return name;
      }
      return (
        <>
          <span className="italic">{parentTab.name}</span>
          <span className="mx-2">→</span>
          <span className="underline">{childTab.name}</span>
        </>
      );
    }
    return name;
  };

  return (
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
          <AlertDialogTitle>Reset Analysis of: {getName()}</AlertDialogTitle>
          <AlertDialogDescription className="text-gray-700">
            Are you sure you want to reset the analysis? This will revert all
            changes to the original state.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isResetting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleReset();
            }}
            disabled={isResetting}
            className="bg-destructive text-destructive-foreground hover:bg-red-600"
          >
            {isResetting ? "Resetting..." : "Reset"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
