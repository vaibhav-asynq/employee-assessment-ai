import { useState } from "react";
import { templatesIds } from "@/lib/types/types.analysis";
import { useAnalysisStore } from "@/zustand/store/analysisStore";
import { useInterviewDataStore } from "@/zustand/store/interviewDataStore";
import { useUser } from "@clerk/nextjs";

export const useSnapshotSaver = () => {
  const { user } = useUser();
  const fileId = useInterviewDataStore((state) => state.fileId);
  const templates = useAnalysisStore((state) => state.templates);
  const { fullReport, saveSnapshot } = useInterviewDataStore();

  //TODO: use react-query for data fetching

  const [saving, setSaving] = useState(false);

  const saveSnapshotToDb = async (
    triggerType: "manual" | "auto",
    makeActive: boolean = false,
  ) => {
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
          triggerType,
          {
            sorted_strength: fullReport?.sorted_competency?.sorted_strength,
            sorted_areas: fullReport?.sorted_competency?.sorted_areas,
          },
          null,
          makeActive,
        );
      }
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setSaving(false);
    }
  };

  return {
    saving,
    saveSnapshotToDb,
  };
};
