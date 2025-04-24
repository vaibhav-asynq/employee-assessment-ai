"use client";
import { getSnapshotById } from "@/lib/api";
import { useSnapshotById, useLatestSnapshot } from "@/lib/react-query";
import { useInterviewDataStore } from "@/zustand/store/interviewDataStore";
import { useAnalysisStore } from "@/zustand/store/analysisStore";
import { templatesIds } from "@/lib/types/types.analysis";
import { useCallback, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Snapshot } from "@/lib/types/types.snapshot";

export const useSnapshotLoader = (
  snapshotId?: number | null,
  autofetch: boolean = false,
) => {
  const { user } = useUser();
  const { fileId } = useInterviewDataStore();
  const { addTemplate } = useAnalysisStore();

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

  const populateSnapshotInStores = useCallback(
    (data: Snapshot) => {
      const { manual_report, ai_Competencies, full_report } = data;

      addTemplate(templatesIds.base, manual_report.editable, false, true);
      addTemplate(templatesIds.fullReport, full_report.editable, false, true);
      addTemplate(
        templatesIds.aiCompetencies,
        ai_Competencies.editable,
        false,
        true,
      );
    },
    [addTemplate],
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
