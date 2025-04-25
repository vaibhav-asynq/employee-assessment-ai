"use client";
import { getSnapshotById } from "@/lib/api";
import { useSnapshotById, useLatestSnapshot } from "@/lib/react-query";
import { useInterviewDataStore } from "@/zustand/store/interviewDataStore";
import { useAnalysisStore } from "@/zustand/store/analysisStore";
import { templatesIds } from "@/lib/types/types.analysis";
import { useCallback, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Snapshot } from "@/lib/types/types.snapshot";
import { useUserPreferencesStore } from "@/zustand/store/userPreferencesStore";

export const useSnapshotLoader = (
  snapshotId?: number | null,
  autofetch: boolean = false,
) => {
  const { user } = useUser();
  const { fileId } = useInterviewDataStore();
  const { addTemplate, resetAnalysisToOriginal } = useAnalysisStore();
  const { setFeedbackData, setAdviceData } = useInterviewDataStore();

  const {
    data: snapshotData,
    refetch: refetchSnapshotById,
    error: errorSnapshotById,
  } = useSnapshotById(snapshotId ?? null, { enabled: autofetch });

  const {
    data: latestSnapshotData,
    refetch: refetchLatestSnapshot,
    error: errorLatestSnapshot,
  } = useLatestSnapshot(fileId, snapshotId ? undefined : user?.id, {
    enabled: autofetch,
  });

  const snapshot = snapshotData || latestSnapshotData;
  const refetch = snapshotId ? refetchSnapshotById : refetchLatestSnapshot;
  const error = snapshotId ? errorSnapshotById : errorLatestSnapshot;
  const { addChildTab, addPath, deleteChildTab, deletePath } = useUserPreferencesStore();

  const populateSnapshotInStores = useCallback(
    (data: Snapshot) => {
      resetAnalysisToOriginal();
      const { manual_report, ai_Competencies, full_report } = data;

      if (
        Object.keys(manual_report.editable).length === 0 &&
        manual_report.editable.constructor === Object
      ) {
        console.log("JSON is blank");
      } else {
        addPath("manual-report", "Manual Report");
        addTemplate(templatesIds.base, manual_report.editable, false, true);
      }

      if (
        Object.keys(full_report.editable).length === 0 &&
        full_report.editable.constructor === Object
      ) {
        console.log("JSON is blank");
      } else {
        addPath("ai-agent-full-report", "AI generated full report");
        addChildTab(
          "ai-agent-full-report",
          "interview-feedback",
          "Sorted by stakeholders",
        );
        addChildTab(
          "ai-agent-full-report",
          "sorted-evidence",
          "Sorted by competency",
        );
        addTemplate(templatesIds.fullReport, full_report.editable, false, true);
      }

      if (
        Object.keys(ai_Competencies.editable).length === 0 &&
        ai_Competencies.editable.constructor === Object
      ) {
        console.log("JSON is blank");
        deletePath("ai-competencies")
      } else {
        addPath("ai-competencies", "AI competencies");
        addChildTab(
          "ai-competencies",
          "interview-feedback",
          "Sorted by stakeholders",
        );
        addChildTab(
          "ai-agent-full-report",
          "sorted-evidence",
          "Sorted Evidence",
        );
        addTemplate(
          templatesIds.aiCompetencies,
          ai_Competencies.editable,
          false,
          true,
        );
      }
      setAdviceData(manual_report.sorted_by?.stakeholders?.adviceData ?? {});
      setFeedbackData(
        manual_report.sorted_by?.stakeholders?.feedbackData ?? {},
      );
    },
    [addTemplate, setAdviceData, setFeedbackData],
  );

  useEffect(() => {
    if (!autofetch) return;
    if (!snapshotData && !latestSnapshotData) return;
    const data = snapshotData || latestSnapshotData;
    if (!data) return;

    populateSnapshotInStores(data);
  }, [autofetch, latestSnapshotData, populateSnapshotInStores, snapshotData]);

  const loadSnapshot = async (customSnapshotId?: number | null) => {
    try {
      let data: Snapshot | null;

      if (customSnapshotId ?? snapshotId) {
        const idToFetch = customSnapshotId ?? snapshotId;
        data = idToFetch ? await getSnapshotById(idToFetch) : null;
      } else {
        const result = await refetchLatestSnapshot();
        data = result.data ?? null;
      }

      if (!data) return;
      populateSnapshotInStores(data);
      return data;
    } catch {
      return;
    }
  };

  return { snapshot, refetch, error, loadSnapshot };
};