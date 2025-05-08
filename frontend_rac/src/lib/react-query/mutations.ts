import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "@/lib/api";
import { queryKeys } from "./queryKeys";
import { SnapshotCreateRequest } from "@/lib/types/types.snapshot";

/**
 * Hook to upload a file
 */
export const useUploadFile = () => {
  return useMutation({
    mutationFn: ({
      file,
      useCache = true,
    }: {
      file: File;
      useCache?: boolean;
    }) => api.uploadFile(file, useCache),
  });
};

/**
 * Hook to save a snapshot
 */
export const useSaveSnapshot = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      snapshotData,
      userId,
      makeCurrent = false,
    }: {
      snapshotData: SnapshotCreateRequest;
      userId: string;
      makeCurrent?: boolean;
    }) => api.saveSnapshot(snapshotData, userId, makeCurrent),
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.snapshots.latest(
          variables.snapshotData.file_id,
          variables.userId,
        ),
      });

      if (variables.makeCurrent) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.snapshots.current(variables.snapshotData.file_id),
        });
      }

      queryClient.invalidateQueries({
        queryKey: queryKeys.snapshots.history(variables.snapshotData.file_id),
      });
    },
  });
};

/**
 * Hook to set a snapshot as the current snapshot
 */
export const useSetCurrentSnapshot = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      fileId,
      snapshotId,
    }: {
      fileId: string;
      snapshotId: number;
    }) => api.setCurrentSnapshot(fileId, snapshotId),
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.snapshots.current(variables.fileId),
      });
    },
  });
};

/**
 * Hook to generate strength content
 */
export const useGenerateStrengthContent = () => {
  return useMutation({
    mutationFn: ({
      heading,
      fileId,
      existingContent,
    }: {
      heading: string;
      fileId: string;
      existingContent: string;
    }) => api.generateStrengthContent(heading, fileId, existingContent),
  });
};

/**
 * Hook to generate area content
 */
export const useGenerateAreaContent = () => {
  return useMutation({
    mutationFn: ({
      heading,
      fileId,
      existingContent,
    }: {
      heading: string;
      fileId: string;
      existingContent: string;
    }) => api.generateAreaContent(heading, fileId, existingContent),
  });
};

/**
 * Hook to generate next steps
 */
export const useGenerateNextSteps = () => {
  return useMutation({
    mutationFn: ({
      areasToTarget,
      fileId,
    }: {
      areasToTarget: { [key: string]: string };
      fileId: string;
    }) => api.generateNextSteps(areasToTarget, fileId),
  });
};

/**
 * Hook to sort strengths evidence
 */
export const useSortStrengthsEvidence = () => {
  return useMutation({
    mutationFn: ({
      fileId,
      headings,
    }: {
      fileId: string;
      headings: string[];
    }) => api.sortStrengthsEvidence(fileId, headings),
  });
};

/**
 * Hook to sort areas evidence
 */
export const useSortAreasEvidence = () => {
  return useMutation({
    mutationFn: ({
      fileId,
      headings,
    }: {
      fileId: string;
      headings: string[];
    }) => api.sortAreasEvidence(fileId, headings),
  });
};

/**
 * Hook to generate a Word document
 */
export const useGenerateWordDocument = () => {
  return useMutation({
    mutationFn: (data: any) => api.generateWordDocument(data),
  });
};

/**
 * Hook to generate a PDF document
 */
export const useGeneratePdfDocument = () => {
  return useMutation({
    mutationFn: (data: any) => api.generatePdfDocument(data),
  });
};

/**
 * Hook to upload an updated report
 */
export const useUploadUpdatedReport = () => {
  return useMutation({
    mutationFn: (file: File) => api.uploadUpdatedReport(file),
  });
};

/**
 * Hook to delete a file task
 */
export const useDeleteFileTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: number) => api.deleteFileTask(taskId),
    onSuccess: () => {
      // Invalidate the file task history query to refresh the list
      queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.all,
      });
    },
  });
};

/**
 * Hook to delete a snapshot
 */
export const useDeleteSnapshot = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (snapshotId: number) => api.deleteSnapshot(snapshotId),
    onSuccess: (_, variables) => {
      // Since we don't know the fileId here, we need to invalidate all snapshot queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.snapshots.all,
      });
    },
  });
};
