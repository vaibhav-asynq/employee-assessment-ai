"use client";
import { getSnapshotById } from "@/lib/api";
import { useSnapshotById, useLatestSnapshot } from "@/lib/react-query";
import { useInterviewDataStore } from "@/zustand/store/interviewDataStore";
import { useAnalysisStore } from "@/zustand/store/analysisStore";
import { templatesIds } from "@/lib/types/types.analysis";
import { base } from "@/lib/analysis/templates";
import { convertInterviewAnalysisDataToTemplatedData } from "@/lib/utils/analysisUtils";
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
  const { addChildTab, addPath } = useUserPreferencesStore();

  // Function to populate stores with snapshot data
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

  // Function to initialize empty templates when no snapshot is available
  const initializeEmptyTemplates = useCallback(() => {
    console.log("Initializing empty templates for all reports");
    
    // Convert the base template to the required format
    const emptyTemplate = convertInterviewAnalysisDataToTemplatedData(base);
    
    // Add empty templates for all three report types
    addTemplate(templatesIds.base, emptyTemplate, false, true);
    addTemplate(templatesIds.fullReport, emptyTemplate, false, true);
    addTemplate(templatesIds.aiCompetencies, emptyTemplate, false, true);
    
    console.log("Empty templates initialized successfully");
  }, [addTemplate]);

  useEffect(() => {
    if (!autofetch) return;
    
    // If we have snapshot data, populate the stores with it
    if (snapshotData || latestSnapshotData) {
      const data = snapshotData || latestSnapshotData;
      if (data) {
        console.log("Autofetch: Populating stores with snapshot data");
        populateSnapshotInStores(data);
      }
    } 
    // If we don't have snapshot data but autofetch is enabled and we have a fileId,
    // initialize empty templates
    else if (fileId) {
      console.log("Autofetch: No snapshot data found, initializing empty templates");
      initializeEmptyTemplates();
    }
  }, [
    autofetch, 
    latestSnapshotData, 
    snapshotData, 
    populateSnapshotInStores, 
    initializeEmptyTemplates,
    fileId
  ]);

  const loadSnapshot = async (customSnapshotId?: number | null) => {
    try {
      console.log("Loading snapshot...", { customSnapshotId, snapshotId, fileId, userId: user?.id });
      let data: Snapshot | null;

      if (customSnapshotId ?? snapshotId) {
        const idToFetch = customSnapshotId ?? snapshotId;
        console.log(`Fetching snapshot by ID: ${idToFetch}`);
        data = idToFetch ? await getSnapshotById(idToFetch) : null;
      } else {
        console.log(`Fetching latest snapshot for fileId: ${fileId}, userId: ${user?.id}`);
        const result = await refetchLatestSnapshot();
        data = result.data ?? null;
      }

      if (!data) {
        console.warn("No snapshot data returned, initializing empty templates");
        // Initialize empty templates when no snapshot is found
        initializeEmptyTemplates();
        return null;
      }
      
      console.log("Snapshot loaded successfully:", data);
      populateSnapshotInStores(data);
      return data;
    } catch (error) {
      console.error("Error loading snapshot:", error);
      // Initialize empty templates when there's an error loading the snapshot
      console.warn("Initializing empty templates due to snapshot loading error");
      initializeEmptyTemplates();
      // Rethrow the error so the caller can handle it
      throw error;
    }
  };

  return { snapshot, refetch, error, loadSnapshot };
};
