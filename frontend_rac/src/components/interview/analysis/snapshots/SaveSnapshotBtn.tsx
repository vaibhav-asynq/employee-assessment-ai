import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2, PackagePlus } from "lucide-react";
import { useInterviewDataStore } from "@/zustand/store/interviewDataStore";
import { useSnapshotSaver } from "@/hooks/useSnapshotSaver";

export function SaveSnapshotBtn() {
  const { isSaving, saveSnapshotToDb } = useSnapshotSaver();
  const fileId = useInterviewDataStore((state) => state.fileId);

  return (
    <Button
      className={cn("border-foreground")}
      variant={"outline"}
      disabled={isSaving || !fileId}
      size={"sm"}
      onClick={async (e) => {
        e.preventDefault();
        saveSnapshotToDb("manual", true);
      }}
    >
      {isSaving ? (
        <div className="flex items-center gap-2">
          <Loader2 className="animate-spin" size={20} />
          <span>saving snapshot...</span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <PackagePlus size={18} />
          <span>save snapshot</span>
        </div>
      )}
    </Button>
  );
}
