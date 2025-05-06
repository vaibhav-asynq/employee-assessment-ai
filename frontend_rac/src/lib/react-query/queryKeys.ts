export const queryKeys = {
  // Task related queries
  tasks: {
    all: ["tasks"] as const,
    byUserId: (userId: string) =>
      [...queryKeys.tasks.all, "byUserId", userId] as const,
    detail: (taskId: string) =>
      [...queryKeys.tasks.all, "detail", taskId] as const,
  },

  // Snapshot related queries
  snapshots: {
    all: ["snapshots"] as const,
    byId: (snapshotId: number) =>
      [...queryKeys.snapshots.all, "byId", snapshotId] as const,
    latest: (fileId: string, userId: string) =>
      [...queryKeys.snapshots.all, "latest", fileId, userId] as const,
    current: (fileId: string) =>
      [...queryKeys.snapshots.all, "current", fileId] as const,
    history: (fileId: string) =>
      [...queryKeys.snapshots.all, "history", fileId] as const,
  },

  // Report generation related queries
  reports: {
    all: ["reports"] as const,
    byFileId: (fileId: string) =>
      [...queryKeys.reports.all, "byFileId", fileId] as const,
  },

  // Feedback related queries
  feedback: {
    all: ["feedback"] as const,
    byFileId: (fileId: string) =>
      [...queryKeys.feedback.all, "byFileId", fileId] as const,
  },

  // Advice related queries
  advice: {
    all: ["advice"] as const,
    byFileId: (fileId: string) =>
      [...queryKeys.advice.all, "byFileId", fileId] as const,
  },
  // stakeholder data, i.e. combined
  manualReport: {
    all: ["manualReport"] as const,
    stakeholder: () => [...queryKeys.manualReport.all, "stakeholder"] as const,
  },

  // Raw data related queries
  rawData: {
    all: ["rawData"] as const,
    byFileId: (fileId: string) =>
      [...queryKeys.rawData.all, "byFileId", fileId] as const,
  },

  // Strength evidences related queries
  strengthEvidences: {
    all: ["strengthEvidences"] as const,
    byFileId: (fileId: string, numCompetencies: number) =>
      [
        ...queryKeys.strengthEvidences.all,
        "byFileId",
        fileId,
        numCompetencies,
      ] as const,
  },

  // Development areas related queries
  developmentAreas: {
    all: ["developmentAreas"] as const,
    byFileId: (fileId: string, numCompetencies: number) =>
      [
        ...queryKeys.developmentAreas.all,
        "byFileId",
        fileId,
        numCompetencies,
      ] as const,
  },
};
