import { create } from "zustand";
import { FeedbackData } from "@/lib/types";
import { Snapshot, SnapshotReport } from "@/lib/types/types.snapshot";

import {
  uploadFile,
  getFeedback,
  getAdvice,
  saveSnapshot,
  getSnapshotById,
} from "@/lib/api";

type InterviewDataState = {
  // States
  loading: boolean;
  error: string;
  file: File | null;
  fileId: string | null;
  uploadProgress: "uploading" | "processing" | null;
  //TODO: check if implementing rawData?
  rawData: any | null;
  adviceData: any | null;
  feedbackData: FeedbackData | null;
  currentSnapshotId: number | null;
  currentSnapshot: Snapshot | null;
  isSavingSnapshot: boolean;
  isLoadingSnapshot: boolean;

  setFileId: (fileId: string | null) => void;
  fetchFeedbackData: (useCache?: boolean) => Promise<void>;
  handleSelectPdf: (
    event: React.ChangeEvent<HTMLInputElement>,
    callback?: () => void,
    useCache?: boolean,
  ) => Promise<void>;
  saveSnapshot: (
    manualReport: Record<string, any>,
    fullReport: Record<string, any>,
    aiCompetencies: Record<string, any>,
    triggerType?: "manual" | "auto",
    parentId?: number | null,
    make_active?: boolean,
  ) => Promise<void>;
  loadSnapshotById: (snapshotId: number) => Promise<Snapshot | null>;
};

export const useInterviewDataStore = create<InterviewDataState>((set, get) => ({
  // initial States
  loading: false,
  error: "",
  file: null,
  fileId: null,
  uploadProgress: null,
  rawData: null,
  adviceData: null,
  feedbackData: null,
  currentSnapshotId: null,
  currentSnapshot: null,
  isSavingSnapshot: false,
  isLoadingSnapshot: false,

  // Handle PDF Upload
  handleSelectPdf: async (
    event: React.ChangeEvent<HTMLInputElement>,
    callback?: () => void,
    useCache: boolean = true,
  ) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;
    if (uploadedFile.type !== "application/pdf") {
      set({ error: "Please upload a PDF file" });
      return;
    }
    set({
      loading: true,
      error: "",
      uploadProgress: "uploading",
    });
    try {
      const id = await uploadFile(uploadedFile, useCache);
      console.log("File uploaded, ID:", id);
      set({
        fileId: id,
        file: uploadedFile,
        uploadProgress: "processing",
        rawData: null,
      });
      if (callback) callback();
    } catch (error) {
      console.error("Upload failed:", error);
      set({
        error: error instanceof Error ? error.message : "Failed to upload PDF",
      });
    } finally {
      set({ loading: false, uploadProgress: null });
    }
  },

  fetchFeedbackData: async (useCache: boolean = true) => {
    const { fileId } = get();
    if (!fileId) return;
    set({ loading: true, error: "" });
    try {
      console.log("Fetching feedback data...");
      const [feedbackData, adviceData] = await Promise.all([
        getFeedback(fileId, useCache),
        getAdvice(fileId, useCache),
      ]);
      //TODO: i think not doing anything from using feedback data.
      console.log("Feedback data received:", feedbackData);
      console.log("Advice data received:", adviceData);
      if (!feedbackData) {
        throw new Error("No feedback data received");
      }
      set({ feedbackData, adviceData });
    } catch (err) {
      console.error("Error fetching feedback data:", err);
      set({
        error: err instanceof Error ? err.message : "Failed to get feedback.",
      });
    } finally {
      set({ loading: false });
    }
  },

  setFileId: (fileId: string | null) => {
    set({ fileId });
  },

  saveSnapshot: async (
    manualReport: Record<string, any>,
    fullReport: Record<string, any>,
    aiCompetencies: Record<string, any>,
    triggerType: "manual" | "auto" = "manual",
    parentId?: number | null,
    make_active: boolean = false,
  ) => {
    const { fileId, adviceData, feedbackData } = get();
    if (!fileId) {
      set({ error: "No file selected. Cannot save snapshot." });
      return;
    }

    set({ isSavingSnapshot: true, error: "" });

    try {
      // Create snapshot report objects
      const snapshotData = {
        file_id: fileId,
        manual_report: {
          editable: manualReport,
          sorted_by: {
            stakeholders: { adviceData, feedbackData },
            competency: {},
          },
        },
        full_report: {
          editable: fullReport,
          sorted_by: {
            stakeholders: {},
            competency: {},
          },
        },
        ai_Competencies: {
          editable: aiCompetencies,
          sorted_by: {
            stakeholders: {},
            competency: {},
          },
        },
        trigger_type: triggerType,
        parent_id: parentId,
      };

      const response = await saveSnapshot(snapshotData, make_active);
      set({ currentSnapshotId: response.id });
      console.log("Snapshot saved successfully:", response);
      return response;
    } catch (error) {
      console.error("Error saving snapshot:", error);
      set({
        error:
          error instanceof Error ? error.message : "Failed to save snapshot",
      });
      throw error;
    } finally {
      set({ isSavingSnapshot: false });
    }
  },
  loadSnapshotById: async (snapshotId: number) => {
    set({ isLoadingSnapshot: true, error: "" });

    try {
      const snapshot = await getSnapshotById(snapshotId);

      if (!snapshot) {
        throw new Error(`Snapshot with ID ${snapshotId} not found`);
      }

      set({
        currentSnapshotId: snapshot.id,
        currentSnapshot: snapshot,
        fileId: snapshot.file_id,
      });

      console.log("Snapshot loaded successfully:", snapshot);
      return snapshot;
    } catch (error) {
      console.error(`Error loading snapshot with ID ${snapshotId}:`, error);
      set({
        error:
          error instanceof Error
            ? error.message
            : `Failed to load snapshot with ID ${snapshotId}`,
      });
      return null;
    } finally {
      set({ isLoadingSnapshot: false });
    }
  },
}));
