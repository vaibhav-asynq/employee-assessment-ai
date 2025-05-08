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
  const { templates } = useAnalysisStore();
  const { selectedPath } = useUserPreferencesStore();
  const { fileId, fullReport, manualReport, aiCompetencies } =
    useInterviewDataStore();

  const saveSnapshotMutation = useSaveSnapshot();
  const isSavingRef = useRef(false);

  const latestManualReportCompetencyRef = useRef({
    sorted_strength: manualReport?.sorted_by_competency?.sorted_strength,
    sorted_areas: manualReport?.sorted_by_competency?.sorted_areas,
  });

  const latestFullReportCompetencyRef = useRef({
    sorted_strength: fullReport?.sorted_by_competency?.sorted_strength,
    sorted_areas: fullReport?.sorted_by_competency?.sorted_areas,
  });

  const latestAiCompetenciesRef = useRef(
    aiCompetencies?.sorted_by_competency?.data,
  );

  // Track previous state to detect changes
  const previousStateRef = useRef({
    path: selectedPath,
    manualReportCompetency: latestManualReportCompetencyRef.current,
    fullReportCompetency: latestFullReportCompetencyRef.current,
    aiCompetencies: latestAiCompetenciesRef.current,
    stakeholdersAdvice: manualReport.sorted_by?.stakeholders?.adviceData,
    stakeholdersFeedback: manualReport.sorted_by?.stakeholders?.feedbackData,
  });

  // Function to check if state has changed
  const hasStateChanged = useCallback(() => {
    if (!previousStateRef.current.path && selectedPath) return true;
    if (previousStateRef.current.path !== selectedPath) return true;

    // Check if stakeholders data has changed
    // if (
    //   JSON.stringify(previousStateRef.current.stakeholdersAdvice) !==
    //   JSON.stringify(manualReport.sorted_by?.stakeholders?.adviceData)
    // )
    //   return true;
    //
    // if (
    //   JSON.stringify(previousStateRef.current.stakeholdersFeedback) !==
    //   JSON.stringify(manualReport.sorted_by?.stakeholders?.feedbackData)
    // )
    //   return true;

    // Check if competency data has changed
    // if (
    //   JSON.stringify(previousStateRef.current.manualReportCompetency) !==
    //   JSON.stringify(latestManualReportCompetencyRef.current)
    // )
    //   return true;
    //
    // if (
    //   JSON.stringify(previousStateRef.current.fullReportCompetency) !==
    //   JSON.stringify(latestFullReportCompetencyRef.current)
    // )
    //   return true;
    //
    // if (
    //   JSON.stringify(previousStateRef.current.aiCompetencies) !==
    //   JSON.stringify(latestAiCompetenciesRef.current)
    // )
    //   return true;

    return false;
  }, [selectedPath]);

  const updatePreviousState = useCallback(() => {
    previousStateRef.current = {
      path: selectedPath,
      manualReportCompetency: latestManualReportCompetencyRef.current,
      fullReportCompetency: latestFullReportCompetencyRef.current,
      aiCompetencies: latestAiCompetenciesRef.current,
      stakeholdersAdvice: manualReport.sorted_by?.stakeholders?.adviceData,
      stakeholdersFeedback: manualReport.sorted_by?.stakeholders?.feedbackData,
    };
  }, [
    selectedPath,
    manualReport.sorted_by?.stakeholders?.adviceData,
    manualReport.sorted_by?.stakeholders?.feedbackData,
  ]);

  // Update refs when data changes
  useEffect(() => {
    latestManualReportCompetencyRef.current = {
      sorted_strength: manualReport?.sorted_by_competency?.sorted_strength,
      sorted_areas: manualReport?.sorted_by_competency?.sorted_areas,
    };
  }, [
    manualReport?.sorted_by_competency?.sorted_strength,
    manualReport?.sorted_by_competency?.sorted_areas,
  ]);

  useEffect(() => {
    latestFullReportCompetencyRef.current = {
      sorted_strength: fullReport?.sorted_by_competency?.sorted_strength,
      sorted_areas: fullReport?.sorted_by_competency?.sorted_areas,
    };
  }, [
    fullReport?.sorted_by_competency?.sorted_strength,
    fullReport?.sorted_by_competency?.sorted_areas,
  ]);

  useEffect(() => {
    latestAiCompetenciesRef.current =
      aiCompetencies?.sorted_by_competency?.data;
  }, [aiCompetencies?.sorted_by_competency?.data]);

  const saveSnapshotToDb = useCallback(
    (
      triggerType: "manual" | "auto",
      makeActive: boolean = false,
      snapshotName?: string,
      parentId?: number,
    ) => {
      if (!fileId || !user?.id) return;
      if (
        !manualReport.sorted_by?.stakeholders?.adviceData ||
        !manualReport.sorted_by?.stakeholders?.feedbackData
      )
        return;

      const manual_report_data = templates[templatesIds.base];
      const ai_competencies_data = templates[templatesIds.aiCompetencies];
      const full_report_data = templates[templatesIds.fullReport];

      // Use the latest data from refs instead of the potentially stale data from the dependency array
      const sorted_by_competencies_manual_report =
        latestManualReportCompetencyRef.current;
      const sorted_by_competencies_full_report =
        latestFullReportCompetencyRef.current;
      const sorted_by_competencies_ai_competencies =
        latestAiCompetenciesRef.current;

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

      console.log("will save this data", snapshotData);
      saveSnapshotMutation.mutate({
        snapshotData,
        makeCurrent: makeActive,
        userId: user.id,
      });
    },
    [
      fileId,
      manualReport.sorted_by?.stakeholders?.adviceData,
      manualReport.sorted_by?.stakeholders?.feedbackData,
      saveSnapshotMutation,
      selectedPath,
      templates,
      user?.id,
    ],
  );

  // Set up interval to check for changes and save
  useEffect(() => {
    const intervalId = setInterval(() => {
      // Skip if already saving or missing required data
      if (isSavingRef.current || !fileId || !user?.id) return;
      if (
        !manualReport.sorted_by?.stakeholders?.adviceData ||
        !manualReport.sorted_by?.stakeholders?.feedbackData
      )
        return;

      const dataChanged = hasStateChanged();
      // Check if state has changed
      if (dataChanged) {
        console.log("State changed, saving snapshot, need to Implement.");
        isSavingRef.current = true;

        // Save the snapshot
        // saveSnapshotToDb("auto", true);

        // Update previous state reference
        updatePreviousState();
      }
    }, 500); // Check every 5 seconds

    // Cleanup function to clear the interval if the component unmounts
    return () => {
      clearInterval(intervalId);
    };
  }, [
    fileId,
    user?.id,
    hasStateChanged,
    saveSnapshotToDb,
    updatePreviousState,
    manualReport.sorted_by?.stakeholders?.adviceData,
    manualReport.sorted_by?.stakeholders?.feedbackData,
  ]);

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
