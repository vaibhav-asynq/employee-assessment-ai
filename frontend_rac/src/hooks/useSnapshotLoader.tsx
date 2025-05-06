"use client";
import { getSnapshotById, getLatestSnapshot } from "@/lib/api";
import { useSnapshotById, useCurrentSnapshot } from "@/lib/react-query";
import { useInterviewDataStore } from "@/zustand/store/interviewDataStore";
import { useAnalysisStore } from "@/zustand/store/analysisStore";
import { TemplatedData, templatesIds } from "@/lib/types/types.analysis";
import { useCallback, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Snapshot } from "@/lib/types/types.snapshot";
import { useUserPreferencesStore } from "@/zustand/store/userPreferencesStore";
import { ANALYSIS_TAB_NAMES } from "@/lib/constants";
import { parseHierarchicalPath } from "@/lib/types/types.user-preferences";

// TODO: move it to proper folder/file
export function hasMeaningfulTemplateData(editable: TemplatedData): boolean {
  if (!editable) return false;

  // Check name
  if (editable.name && editable.name.trim() !== "") return true;

  // Check advices
  if (
    Array.isArray(editable.advices) &&
    editable.advices.length > 0 &&
    editable.advices.some(
      (advice) => advice.advice && advice.advice.some((a) => a.trim() !== ""),
    )
  ) {
    return true;
  }

  // Check strengths items
  if (editable.strengths?.items) {
    for (const key in editable.strengths.items) {
      const item = editable.strengths.items[key];
      if (
        (item.heading && item.heading.trim() !== "") ||
        (item.content && item.content.trim() !== "") ||
        (Array.isArray(item.evidence) && item.evidence.length > 0)
      ) {
        return true;
      }
    }
  }

  // Check areas_to_target items
  if (editable.areas_to_target?.items) {
    for (const key in editable.areas_to_target.items) {
      const item = editable.areas_to_target.items[key];
      if (
        (item.heading && item.heading.trim() !== "") ||
        (item.content && item.content.trim() !== "") ||
        (Array.isArray(item.evidence) && item.evidence.length > 0) ||
        (Array.isArray(item.competencyAlignment) &&
          item.competencyAlignment.length > 0)
      ) {
        return true;
      }
    }
  }

  // Check next_steps
  if (Array.isArray(editable.next_steps) && editable.next_steps.length > 0) {
    for (const step of editable.next_steps) {
      if (typeof step === "string") {
        if (step.trim() !== "") return true;
      } else if (typeof step === "object" && step !== null) {
        if (
          (step.main && step.main.trim() !== "") ||
          (Array.isArray(step.sub_points) &&
            step.sub_points.some((sub: string) => sub && sub.trim() !== ""))
        ) {
          return true;
        }
      }
    }
  }

  // If none of the above have meaningful data
  return false;
}

export function isBlankJson(jsonObject?: object) {
  if (!jsonObject) return true;
  if (Object.keys(jsonObject).length === 0 && jsonObject.constructor === Object)
    return true;
  return false;
}

export const useSnapshotLoader = (
  snapshotId?: number | null,
  autofetch: boolean = false,
) => {
  const { user } = useUser();
  const {
    fileId,
    updateFullReportSortedCompetency,
    updateManualReportStakeHolderData,
    updateManualReportSortedCompetency,
    updateAiCompetencySortedCompetency,
    setLoadingSnapshot,
  } = useInterviewDataStore();
  const { addTemplate, resetAnalysisToOriginal } = useAnalysisStore();
  const {
    addChildTab,
    setSelectedPath: setCurrentTab,
    deleteChildTab,
    addPath,
    deletePath,
  } = useUserPreferencesStore();

  const {
    data: snapshotData,
    refetch: refetchSnapshotById,
    error: errorSnapshotById,
    isLoading,
    isFetching,
    isRefetching,
    isPending,
  } = useSnapshotById(snapshotId ?? null, { enabled: autofetch });

  const {
    data: latestSnapshotData,
    refetch: refetchLatestSnapshot,
    error: errorLatestSnapshot,
    isLoading: latestLoading,
    isFetching: latestFetching,
    isRefetching: latestRefetching,
    isPending: latestPending,
  } = useCurrentSnapshot(fileId, {
    enabled: autofetch,
  });

  const snapshot = snapshotData || latestSnapshotData;
  const refetch = snapshotId ? refetchSnapshotById : refetchLatestSnapshot;
  const error = snapshotId ? errorSnapshotById : errorLatestSnapshot;

  const populateSnapshotInStores = useCallback(
    (data: Snapshot) => {
      resetAnalysisToOriginal();
      const { manual_report, ai_Competencies, full_report } = data;

      // manual report feedback and advice
      let man_report_adviceData = null;
      let man_report_feedbackData = null;
      if (!isBlankJson(manual_report.sorted_by?.stakeholders?.adviceData)) {
        man_report_adviceData =
          manual_report.sorted_by?.stakeholders?.adviceData;
      }
      if (!isBlankJson(manual_report.sorted_by?.stakeholders?.feedbackData)) {
        man_report_feedbackData =
          manual_report.sorted_by?.stakeholders?.feedbackData;
      }
      updateManualReportStakeHolderData(
        man_report_feedbackData,
        man_report_adviceData,
      );

      if (!isBlankJson(manual_report.editable)) {
        addTemplate(templatesIds.base, manual_report.editable, false, true);
        addPath("manual-report", ANALYSIS_TAB_NAMES.manualReport.text);
        addChildTab(
          "manual-report",
          "interview-feedback",
          ANALYSIS_TAB_NAMES.manualReport.sortedStakeholder,
        );
      }
      if (!isBlankJson(manual_report.sorted_by?.competency)) {
        updateManualReportSortedCompetency({
          sorted_strength:
            manual_report.sorted_by?.competency?.sorted_strength || null,
          sorted_areas:
            manual_report.sorted_by?.competency?.sorted_areas || null,
        });
        addPath("manual-report", ANALYSIS_TAB_NAMES.manualReport.text);
        addChildTab(
          "manual-report",
          "sorted-evidence",
          ANALYSIS_TAB_NAMES.manualReport.sortedCompetency,
        );
      } else {
        deleteChildTab("manual-report", "sorted-evidence");
      }

      // full report
      if (
        !isBlankJson(full_report.editable) &&
        hasMeaningfulTemplateData(full_report.editable)
      ) {
        addTemplate(templatesIds.fullReport, full_report.editable, false, true);
        addPath(
          "ai-agent-full-report",
          ANALYSIS_TAB_NAMES.aiGeneratedFullReport.text,
        );
        addChildTab(
          "ai-agent-full-report",
          "interview-feedback",
          ANALYSIS_TAB_NAMES.manualReport.sortedStakeholder,
        );
        updateFullReportSortedCompetency({
          sorted_areas: full_report.sorted_by?.competency?.sorted_areas,
          sorted_strength: full_report.sorted_by?.competency?.sorted_strength,
        });
        if (
          !isBlankJson(full_report.sorted_by?.competency?.sorted_areas) ||
          !isBlankJson(full_report.sorted_by?.competency?.sorted_strength)
        ) {
          addChildTab(
            "ai-agent-full-report",
            "sorted-evidence",
            ANALYSIS_TAB_NAMES.aiGeneratedFullReport.sortedCompetency,
          );
        } else {
          deleteChildTab("ai-agent-full-report", "sorted-evidence");
        }
      } else {
        deletePath("ai-agent-full-report");
      }

      // ai competency
      if (
        !isBlankJson(ai_Competencies.editable) &&
        hasMeaningfulTemplateData(ai_Competencies.editable)
      ) {
        addTemplate(
          templatesIds.aiCompetencies,
          ai_Competencies.editable,
          false,
          true,
        );
        updateAiCompetencySortedCompetency({
          data: !isBlankJson(ai_Competencies.sorted_by?.competency)
            ? (ai_Competencies.sorted_by?.competency as TemplatedData)
            : ai_Competencies.editable,
        });
        addPath("ai-competencies", ANALYSIS_TAB_NAMES.aiCompetencies.text);
        addChildTab(
          "ai-competencies",
          "interview-feedback",
          ANALYSIS_TAB_NAMES.manualReport.sortedStakeholder,
        );
        addChildTab(
          "ai-competencies",
          "sorted-evidence",
          ANALYSIS_TAB_NAMES.aiGeneratedFullReport.sortedCompetency,
        );
      } else {
        deletePath("ai-competencies");
      }
      // activate last recorded tab
      if (manual_report.selectedPath) {
        const tab = parseHierarchicalPath(manual_report.selectedPath);
        setCurrentTab(tab.parentId, tab.childId);
      }
    },
    [
      addChildTab,
      addPath,
      addTemplate,
      deleteChildTab,
      deletePath,
      resetAnalysisToOriginal,
      setCurrentTab,
      updateAiCompetencySortedCompetency,
      updateFullReportSortedCompetency,
      updateManualReportSortedCompetency,
      updateManualReportStakeHolderData,
    ],
  );

  const loadSnapshot = useCallback(
    async (file_id: string | null, customSnapshotId?: number | null) => {
      setLoadingSnapshot(true);
      try {
        if (!user?.id) return;
        let data: Snapshot | null;
        if (customSnapshotId || snapshotId) {
          const idToFetch = customSnapshotId ?? snapshotId;
          data = idToFetch ? await getSnapshotById(idToFetch) : null;
        } else {
          if (!file_id) return;
          const latestData = await getLatestSnapshot(file_id, user.id);
          data = latestData;
        }
        if (!data) return;
        if (data) populateSnapshotInStores(data);
        return data;
      } catch {
        return;
      } finally {
        setLoadingSnapshot(false);
      }
    },
    [populateSnapshotInStores, setLoadingSnapshot, snapshotId, user?.id],
  );

  useEffect(() => {
    if (!autofetch) return;
    if (!snapshotData && !latestSnapshotData) return;
    const data = snapshotData || latestSnapshotData;
    if (!data) return;

    populateSnapshotInStores(data);
  }, [autofetch, latestSnapshotData, populateSnapshotInStores, snapshotData]);

  return {
    snapshot,
    refetch,
    error,
    loadSnapshot,
    isFetching,
    isLoading,
    isRefetching,
    isPending,
    latestPending,
    latestRefetching,
    latestFetching,
    latestLoading,
  };
};
