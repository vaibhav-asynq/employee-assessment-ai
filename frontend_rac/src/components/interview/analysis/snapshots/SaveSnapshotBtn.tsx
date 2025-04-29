import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2, PackagePlus } from "lucide-react";
import { useInterviewDataStore } from "@/zustand/store/interviewDataStore";
import { useSnapshotSaver } from "@/hooks/useSnapshotSaver";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function SaveSnapshotBtn() {
  const { isSaving, saveSnapshotToDb } = useSnapshotSaver();
  const fileId = useInterviewDataStore((state) => state.fileId);
  const [snapshotName, setSnapshotName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSaveSnapshot = () => {
    saveSnapshotToDb("manual", true, snapshotName || undefined);
    setSnapshotName("");
    console.log(snapshotName);
    setIsDialogOpen(false);
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          className={cn("border-foreground")}
          variant={"outline"}
          disabled={isSaving || !fileId}
          size={"sm"}
          onClick={(e) => {
            e.preventDefault();
            setIsDialogOpen(true);
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
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save Snapshot</DialogTitle>
          <DialogDescription>
            Enter an optional name for your snapshot.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-y-2 py-4">
          <Input
            placeholder="Snapshot name (optional)"
            value={snapshotName}
            onChange={(e) => setSnapshotName(e.target.value)}
            className="w-full"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSaveSnapshot();
              }
            }}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setIsDialogOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSaveSnapshot}
            disabled={isSaving}
          >
            {isSaving ? (
              <div className="flex items-center gap-2">
                <Loader2 className="animate-spin" size={16} />
                <span>Saving...</span>
              </div>
            ) : (
              "Save"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
