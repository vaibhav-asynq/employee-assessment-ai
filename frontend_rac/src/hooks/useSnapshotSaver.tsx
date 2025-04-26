import { templatesIds } from "@/lib/types/types.analysis";
import { useAnalysisStore } from "@/zustand/store/analysisStore";
import { useInterviewDataStore } from "@/zustand/store/interviewDataStore";
import { useUser } from "@clerk/nextjs";
import { useSaveSnapshot } from "@/lib/react-query";
import { SnapshotCreateRequest } from "@/lib/types/types.snapshot";

export const useSnapshotSaver = () => {
  const { user } = useUser();
  const { fileId, adviceData, feedbackData } = useInterviewDataStore();
  const { templates } = useAnalysisStore();
  const { fullReport } = useInterviewDataStore();

  const saveSnapshotMutation = useSaveSnapshot();

  const saveSnapshotToDb = (
    triggerType: "manual" | "auto",
    makeActive: boolean = false,
    parentId?: number,
  ) => {
    if (!fileId || !user?.id) return;

    const manual_report_data = templates[templatesIds.base];
    const ai_competencies_data = templates[templatesIds.aiCompetencies];
    const full_report_data = templates[templatesIds.fullReport];

    const sorted_by_competencies_full_report = {
      sorted_strength: fullReport?.sorted_competency?.sorted_strength,
      sorted_areas: fullReport?.sorted_competency?.sorted_areas,
    };

    const snapshotData: SnapshotCreateRequest = {
      file_id: fileId,
      manual_report: {
        editable: manual_report_data,
        sorted_by: {
          stakeholders: { adviceData, feedbackData },
          competency: {},
        },
      },
      full_report: {
        editable: full_report_data,
        sorted_by: {
          stakeholders: {},
          competency: sorted_by_competencies_full_report,
        },
      },
      ai_Competencies: {
        editable: ai_competencies_data,
        sorted_by: {
          stakeholders: {},
          competency: {},
        },
      },
      trigger_type: triggerType,
      parent_id: parentId,
    };

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
