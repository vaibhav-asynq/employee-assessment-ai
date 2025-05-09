import { useCallback, useEffect, useRef } from "react";
import { templatesIds } from "@/lib/types/types.analysis";
import { useAnalysisStore } from "@/zustand/store/analysisStore";
import { useInterviewDataStore } from "@/zustand/store/interviewDataStore";
import { useUser } from "@clerk/nextjs";
import { useSaveSnapshot } from "@/lib/react-query";
import { SnapshotCreateRequest } from "@/lib/types/types.snapshot";
import { useUserPreferencesStore } from "@/zustand/store/userPreferencesStore";

export const useSnapshotSaver = () => {
  const { user } = useUser();
  const { selectedPath } = useUserPreferencesStore();
  const saveSnapshotMutation = useSaveSnapshot();
  const isSavingRef = useRef(false);

  // Tracking of data.
  const previousPathRef = useRef(selectedPath);

  const saveSnapshotToDb = useCallback(
    (
      triggerType: "manual" | "auto",
      makeActive: boolean = false,
      snapshotName?: string,
      parentId?: number,
    ) => {
      // Get the latest state directly from the stores
      const currentFileId = useInterviewDataStore.getState().fileId;
      const currentUser = user;
      const currentTemplates = useAnalysisStore.getState().templates;
      const currentSelectedPath =
        useUserPreferencesStore.getState().selectedPath;
      const currentManualReport = useInterviewDataStore.getState().manualReport;
      const currentFullReport = useInterviewDataStore.getState().fullReport;
      const currentAiCompetencies =
        useInterviewDataStore.getState().aiCompetencies;

      // Validate required data
      if (!currentFileId || !currentUser?.id) return;
      if (
        !currentManualReport.sorted_by?.stakeholders?.adviceData ||
        !currentManualReport.sorted_by?.stakeholders?.feedbackData
      )
        return;

      // Get template data
      const manual_report_data = currentTemplates[templatesIds.base];
      const ai_competencies_data =
        currentTemplates[templatesIds.aiCompetencies];
      const full_report_data = currentTemplates[templatesIds.fullReport];

      // Create the snapshot data with the latest data
      const snapshotData: SnapshotCreateRequest = {
        file_id: currentFileId,
        snapshot_name: snapshotName,
        manual_report: {
          selectedPath: currentSelectedPath ?? undefined,
          editable: manual_report_data,
          sorted_by: {
            stakeholders: {
              adviceData:
                currentManualReport.sorted_by?.stakeholders?.adviceData,
              feedbackData:
                currentManualReport.sorted_by?.stakeholders?.feedbackData,
            },
            competency: {
              sorted_strength:
                currentManualReport?.sorted_by_competency?.sorted_strength,
              sorted_areas:
                currentManualReport?.sorted_by_competency?.sorted_areas,
            },
          },
        },
        full_report: {
          editable: full_report_data,
          sorted_by: {
            competency: {
              sorted_strength:
                currentFullReport?.sorted_by_competency?.sorted_strength,
              sorted_areas:
                currentFullReport?.sorted_by_competency?.sorted_areas,
            },
          },
        },
        ai_Competencies: {
          editable: ai_competencies_data,
          sorted_by: {
            competency: currentAiCompetencies?.sorted_by_competency?.data,
          },
        },
        trigger_type: triggerType,
        parent_id: parentId,
      };

      console.log("saving snapshot data with", { snapshotData });
      // Save the snapshot
      saveSnapshotMutation.mutate({
        snapshotData,
        makeCurrent: makeActive,
        userId: currentUser.id,
      });
    },
    [saveSnapshotMutation, user],
  );

  // Auto-save when selectedPath changes
  useEffect(() => {
    if (previousPathRef.current === selectedPath) return;

    const currentFileId = useInterviewDataStore.getState().fileId;
    const currentUser = user;
    const currentManualReport = useInterviewDataStore.getState().manualReport;

    if (isSavingRef.current || !currentFileId || !currentUser?.id) return;
    if (
      !currentManualReport.sorted_by?.stakeholders?.adviceData ||
      !currentManualReport.sorted_by?.stakeholders?.feedbackData
    )
      return;

    // Save snapshot when path changes
    if (selectedPath !== previousPathRef.current) {
      isSavingRef.current = true;
      console.log("Path changed, saving snapshot");
      // saveSnapshotToDb("auto", true);

      previousPathRef.current = selectedPath;
    }
  }, [selectedPath, user, saveSnapshotToDb]);

  // Reset isSaving flag when save operation completes
  useEffect(() => {
    if (!saveSnapshotMutation.isPending) {
      isSavingRef.current = false;
    }
  }, [saveSnapshotMutation.isPending]);

  return {
    saveSnapshotToDb,
    isSaving: saveSnapshotMutation.isPending,
    isError: saveSnapshotMutation.isError,
    error: saveSnapshotMutation.error,
    isSuccess: saveSnapshotMutation.isSuccess,
    data: saveSnapshotMutation.data,
  };
};
