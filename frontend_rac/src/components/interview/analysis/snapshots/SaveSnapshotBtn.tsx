import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2, PackagePlus } from "lucide-react";
import { useState } from "react";
import { templatesIds } from "@/lib/types/types.analysis";
import { useAnalysisStore } from "@/zustand/store/analysisStore";
import { useInterviewDataStore } from "@/zustand/store/interviewDataStore";
import { useUser } from "@clerk/nextjs";

export function SaveSnapshotBtn() {
  const { user } = useUser();
  const fileId = useInterviewDataStore((state) => state.fileId);
  const templates = useAnalysisStore((state) => state.templates);
  const { saveSnapshot } = useInterviewDataStore();

  //TODO: use react-query for data fetching

  const [saving, setSaving] = useState(false);

  const handleSaveSnapshot = async () => {
    if (!fileId) return;
    try {
      setSaving(true);
      const manual_report_data = templates[templatesIds.base];
      const ai_competencies_data = templates[templatesIds.aiCompetencies];
      const full_report_data = templates[templatesIds.fullReport];
      if (user?.id) {
        await saveSnapshot(
          user.id,
          manual_report_data,
          full_report_data,
          ai_competencies_data,
          "manual",
          null,
          true,
        );
      }
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Button
      className={cn("border-foreground")}
      variant={"outline"}
      disabled={saving}
      size={"sm"}
      onClick={(e) => {
        e.preventDefault();
        handleSaveSnapshot();
      }}
    >
      {saving ? (
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
