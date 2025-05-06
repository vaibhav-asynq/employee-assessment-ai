import { templatesIds } from "@/lib/types/types.analysis";
import { useAnalysisStore } from "@/zustand/store/analysisStore";
import { useInterviewDataStore } from "@/zustand/store/interviewDataStore";
import { useUser } from "@clerk/nextjs";
import { useSaveSnapshot } from "@/lib/react-query";
import { SnapshotCreateRequest } from "@/lib/types/types.snapshot";
import { useUserPreferencesStore } from "@/zustand/store/userPreferencesStore";

export const useSnapshotSaver = () => {
  const { user } = useUser();
  const { templates } = useAnalysisStore();
  const { selectedPath } = useUserPreferencesStore();
  const { fileId, fullReport, manualReport, aiCompetencies } =
    useInterviewDataStore();

  const saveSnapshotMutation = useSaveSnapshot();

  const saveSnapshotToDb = (
    triggerType: "manual" | "auto",
    makeActive: boolean = false,
    snapshotName?: string,
    parentId?: number,
  ) => {
    if (!fileId || !user?.id) return;

    const manual_report_data = templates[templatesIds.base];
    const ai_competencies_data = templates[templatesIds.aiCompetencies];
    const full_report_data = templates[templatesIds.fullReport];

    const sorted_by_competencies_manual_report = {
      sorted_strength: manualReport?.sorted_by_competency?.sorted_strength,
      sorted_areas: manualReport?.sorted_by_competency?.sorted_areas,
    };
    const sorted_by_competencies_full_report = {
      sorted_strength: fullReport?.sorted_by_competency?.sorted_strength,
      sorted_areas: fullReport?.sorted_by_competency?.sorted_areas,
    };
    const sorted_by_competencies_ai_competencies =
      aiCompetencies?.sorted_by_competency?.data;

    const snapshotData: SnapshotCreateRequest = {
      file_id: fileId,
      snapshot_name: snapshotName,
      manual_report: {
        selectedPath: selectedPath ?? undefined,
        editable: manual_report_data,
        sorted_by: {
          stakeholders: {
            adviceData: manualReport.sorted_by?.stakeholders?.adviceData,
            feedbackData: manualReport.sorted_by?.stakeholders?.feedbackData,
          },
          competency: sorted_by_competencies_manual_report,
        },
      },
      full_report: {
        editable: full_report_data,
        sorted_by: {
          competency: sorted_by_competencies_full_report,
        },
      },
      ai_Competencies: {
        editable: ai_competencies_data,
        sorted_by: {
          competency: sorted_by_competencies_ai_competencies,
        },
      },
      trigger_type: triggerType,
      parent_id: parentId,
    };

    console.log(snapshotData)
    saveSnapshotMutation.mutate({
      snapshotData,
      makeCurrent: makeActive,
      userId: user.id,
    });
  };

  return {
    saveSnapshotToDb,
    isSaving: saveSnapshotMutation.isPending,
    isError: saveSnapshotMutation.isError,
    error: saveSnapshotMutation.error,
    isSuccess: saveSnapshotMutation.isSuccess,
    data: saveSnapshotMutation.data,
  };
};
