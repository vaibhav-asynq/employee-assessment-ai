import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2, WandSparkles } from "lucide-react";
import { generateReport } from "@/lib/api";
import { useState } from "react";
import { templatesIds } from "@/lib/types";
import { useAnalysisStore } from "@/zustand/store/analysisStore";
import { useUserPreferencesStore } from "@/zustand/store/userPreferencesStore";
import { convertInterviewAnalysisDataToTemplatedData } from "@/lib/utils/analysisUtils";
import { ANALYSIS_TAB_NAMES } from "@/lib/constants";
import { useInterviewDataStore } from "@/zustand/store/interviewDataStore";
import { useSnapshotSaver } from "@/hooks/useSnapshotSaver";

export function GenerateFullReport() {
  const { fileId } = useInterviewDataStore();
  const { addTemplate } = useAnalysisStore();
  const {
    addPath: addTab,
    addChildTab,
    setSelectedPath: selectTab,
  } = useUserPreferencesStore();

  //TODO: use react-query for data fetching

  const [generating, setGenerating] = useState(false);
  const { saveSnapshotToDb } = useSnapshotSaver();

  const handleGenrateFullReport = async () => {
    if (!fileId) return;
    try {
      const templateId = templatesIds.fullReport;
      setGenerating(true);

      const data = await generateReport(fileId);
      const templatedData = convertInterviewAnalysisDataToTemplatedData(data);

      addTemplate(templateId, templatedData, false, true);

      addTab(
        "ai-agent-full-report",
        ANALYSIS_TAB_NAMES.aiGeneratedFullReport.text,
      );
      addChildTab(
        "ai-agent-full-report",
        "interview-feedback",
        ANALYSIS_TAB_NAMES.manualReport.sortedStakeholder,
      );
      addChildTab(
        "ai-agent-full-report",
        "sorted-evidence",
        ANALYSIS_TAB_NAMES.aiGeneratedFullReport.sortedCompetency,
      );

      // Set a flag in localStorage to indicate auto-sorting should happen
      localStorage.setItem("autoSortFullReport", "true");

      selectTab("ai-agent-full-report", "interview-feedback");

      setTimeout(() => {
        saveSnapshotToDb("auto", true);
      }, 1000);
    } catch (error) {
      console.error("Upload failed:", error);
      // setError(error instanceof Error ? error.message : "Failed to generate report.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Button
      className={cn("border-foreground")}
      variant={"default"}
      disabled={generating}
      size={"sm"}
      onClick={(e) => {
        e.preventDefault();
        handleGenrateFullReport();
      }}
    >
      {generating ? (
        <div className="flex items-center gap-2">
          <Loader2 className="animate-spin" size={20} />
          <span>Generating report...</span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <WandSparkles size={18} />
          <span>Generate full report</span>
        </div>
      )}
    </Button>
  );
}
