import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { useEffect } from "react";
import * as api from "@/lib/api";
import { queryKeys } from "./queryKeys";
import { Task } from "@/lib/types/types.filetask";
import { Snapshot } from "@/lib/types/types.snapshot";

// Utility type to allow options without queryKey/queryFn
type QueryOptions<T> = Omit<
  UseQueryOptions<T, Error, T, readonly unknown[]>,
  "queryKey" | "queryFn"
>;

export const useTaskHistory = (
  userId: string | undefined,
  options?: QueryOptions<Task[]>,
) => {
  return useQuery<Task[]>({
    queryKey: userId ? queryKeys.tasks.byUserId(userId) : ["no-user"],
    queryFn: () =>
      userId ? api.getFileTaskHistory(userId) : Promise.resolve([]),
    enabled: !!userId,
    // Default cache settings if not provided in options
    gcTime: options?.gcTime ?? 1000 * 60 * 60, // 1 hour
    staleTime: options?.staleTime ?? 1000 * 60, // 1 minute
    ...options,
  });
};

export const useLatestSnapshot = (
  fileId: string | null,
  userId: string | undefined,
  options?: QueryOptions<Snapshot | null>,
) => {
  return useQuery<Snapshot | null>({
    queryKey:
      fileId && userId
        ? queryKeys.snapshots.latest(fileId, userId)
        : ["no-user-file"],
    queryFn: () =>
      fileId && userId
        ? api.getLatestSnapshot(fileId, userId)
        : Promise.resolve(null),
    enabled: !!fileId && !!userId,
    // Default cache settings if not provided in options
    gcTime: options?.gcTime ?? 1000 * 60 * 60 * 24, // 24 hours
    staleTime: options?.staleTime ?? 1000 * 60 * 5, // 5 minutes
    ...options,
  });
};

export const useCurrentSnapshot = (
  fileId: string | null,
  options?: QueryOptions<Snapshot | null>,
) => {
  return useQuery<Snapshot | null>({
    queryKey: fileId ? queryKeys.snapshots.current(fileId) : ["no-fileid"],
    queryFn: () =>
      fileId ? api.getCurrentSnapshot(fileId) : Promise.resolve(null),
    enabled: !!fileId,
    // Default cache settings if not provided in options
    gcTime: options?.gcTime ?? 1000 * 60 * 60 * 24, // 24 hours
    staleTime: options?.staleTime ?? 1000 * 60 * 5, // 5 minutes
    ...options,
  });
};

export const useSnapshotById = (
  snapshotId: number | null,
  options?: QueryOptions<Snapshot | null>,
) => {
  return useQuery<Snapshot | null>({
    queryKey: snapshotId
      ? queryKeys.snapshots.byId(snapshotId)
      : ["no-snapshotid"],
    queryFn: () =>
      snapshotId ? api.getSnapshotById(snapshotId) : Promise.resolve(null),
    enabled: !!snapshotId,
    // Default cache settings if not provided in options
    gcTime: options?.gcTime ?? 1000 * 60 * 60 * 24, // 24 hours
    staleTime: options?.staleTime ?? 1000 * 60 * 5, // 5 minutes
    ...options,
  });
};

export const useSnapshotHistory = (
  fileId: string | null,
  limit?: number,
  offset?: number,
  options?: QueryOptions<Snapshot[]>,
) => {
  const queryResult = useQuery<Snapshot[]>({
    queryKey: fileId
      ? [...queryKeys.snapshots.history(fileId), { limit, offset }]
      : ["no-fileid"],
    queryFn: async () => {
      console.log(`Fetching snapshot history for fileId: ${fileId}, limit: ${limit}, offset: ${offset}`);
      if (!fileId) return [];
      
      try {
        const data = await api.getSnapshotHistory(fileId, limit, offset);
        console.log(`Snapshot history fetch successful, received ${data.length} snapshots`);
        return data;
      } catch (error) {
        console.error(`Error fetching snapshot history:`, error);
        throw error;
      }
    },
    enabled: !!fileId,
    // Default cache settings if not provided in options
    gcTime: options?.gcTime ?? 1000 * 60 * 60 * 24, // 24 hours
    staleTime: options?.staleTime ?? 1000 * 60 * 5, // 5 minutes
    ...options,
  });

  // Log query state changes
  useEffect(() => {
    console.log(`Snapshot history query state:`, {
      fileId,
      isLoading: queryResult.isLoading,
      isError: queryResult.isError,
      error: queryResult.error,
      dataLength: queryResult.data?.length || 0,
      isFetching: queryResult.isFetching
    });
  }, [fileId, queryResult.isLoading, queryResult.isError, queryResult.error, queryResult.data, queryResult.isFetching]);

  return queryResult;
};

export const useReport = (
  fileId: string | null,
  useCache: boolean = true,
  options?: QueryOptions<any>,
) => {
  return useQuery({
    queryKey: fileId
      ? [...queryKeys.reports.byFileId(fileId), { useCache }]
      : ["no-fileid"],
    queryFn: () =>
      fileId ? api.generateReport(fileId, useCache) : Promise.resolve(null),
    enabled: !!fileId,
    // Default cache settings if not provided in options
    gcTime: options?.gcTime ?? 1000 * 60 * 60 * 24, // 24 hours
    staleTime: options?.staleTime ?? 1000 * 60 * 5, // 5 minutes
    ...options,
  });
};

export const useFeedback = (
  fileId: string | null,
  useCache: boolean = true,
  options?: QueryOptions<any>,
) => {
  return useQuery({
    queryKey: fileId
      ? [...queryKeys.feedback.byFileId(fileId), { useCache }]
      : ["no-fileid"],
    queryFn: () =>
      fileId ? api.getFeedback(fileId, useCache) : Promise.resolve(null),
    enabled: !!fileId,
    // Default cache settings if not provided in options
    gcTime: options?.gcTime ?? 1000 * 60 * 60 * 24, // 24 hours
    staleTime: options?.staleTime ?? 1000 * 60 * 5, // 5 minutes
    ...options,
  });
};

export const useAdvice = (
  fileId: string | null,
  useCache: boolean = true,
  options?: QueryOptions<any>,
) => {
  return useQuery({
    queryKey: fileId
      ? [...queryKeys.advice.byFileId(fileId), { useCache }]
      : ["no-fileid"],
    queryFn: () =>
      fileId ? api.getAdvice(fileId, useCache) : Promise.resolve(null),
    enabled: !!fileId,
    // Default cache settings if not provided in options
    gcTime: options?.gcTime ?? 1000 * 60 * 60 * 24, // 24 hours
    staleTime: options?.staleTime ?? 1000 * 60 * 5, // 5 minutes
    ...options,
  });
};

export const useRawData = (
  fileId: string | null,
  useCache: boolean = true,
  options?: QueryOptions<any>,
) => {
  return useQuery({
    queryKey: fileId
      ? [...queryKeys.rawData.byFileId(fileId), { useCache }]
      : ["no-fileid"],
    queryFn: () =>
      fileId ? api.getRawData(fileId, useCache) : Promise.resolve(null),
    enabled: !!fileId,
    // Default cache settings if not provided in options
    gcTime: options?.gcTime ?? 1000 * 60 * 60 * 24, // 24 hours
    staleTime: options?.staleTime ?? 1000 * 60 * 5, // 5 minutes
    ...options,
  });
};

export const useStrengthEvidences = (
  fileId: string | null,
  numCompetencies: number = 3,
  useCache: boolean = true,
  options?: QueryOptions<any>,
) => {
  return useQuery({
    queryKey: fileId
      ? [
          ...queryKeys.strengthEvidences.byFileId(fileId, numCompetencies),
          { useCache },
        ]
      : ["no-fileid"],
    queryFn: () =>
      fileId
        ? api.getStrengthEvidences(fileId, numCompetencies, useCache)
        : Promise.resolve(null),
    enabled: !!fileId,
    // Default cache settings if not provided in options
    gcTime: options?.gcTime ?? 1000 * 60 * 60 * 24, // 24 hours
    staleTime: options?.staleTime ?? 1000 * 60 * 5, // 5 minutes
    ...options,
  });
};

export const useDevelopmentAreas = (
  fileId: string | null,
  numCompetencies: number = 3,
  useCache: boolean = true,
  options?: QueryOptions<any>,
) => {
  return useQuery({
    queryKey: fileId
      ? [
          ...queryKeys.developmentAreas.byFileId(fileId, numCompetencies),
          { useCache },
        ]
      : ["no-fileid"],
    queryFn: () =>
      fileId
        ? api.getDevelopmentAreas(fileId, numCompetencies, useCache)
        : Promise.resolve(null),
    enabled: !!fileId,
    // Default cache settings if not provided in options
    gcTime: options?.gcTime ?? 1000 * 60 * 60 * 24, // 24 hours
    staleTime: options?.staleTime ?? 1000 * 60 * 5, // 5 minutes
    ...options,
  });
};
