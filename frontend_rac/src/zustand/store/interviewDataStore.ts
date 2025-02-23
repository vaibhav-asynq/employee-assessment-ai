import { create } from "zustand";
import { FeedbackData } from "@/lib/types";

import { uploadFile, getFeedback, getAdvice } from "@/lib/api";

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

  fetchFeedbackData: () => Promise<void>;
  handleSelectPdf: (
    event: React.ChangeEvent<HTMLInputElement>,
    callback?: () => void,
  ) => Promise<void>;
};

export const useInterviewDataStore = create<InterviewDataState>((set) => ({
  // initial States
  loading: false,
  error: "",
  file: null,
  fileId: null,
  uploadProgress: null,
  rawData: null,
  adviceData: null,
  feedbackData: null,

  // Handle PDF Upload
  handleSelectPdf: async (
    event: React.ChangeEvent<HTMLInputElement>,
    callback?: () => void,
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
      const id = await uploadFile(uploadedFile);
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

  fetchFeedbackData: async () => {
    set({ loading: true, error: "" });
    try {
      console.log("Fetching feedback data...");
      const [feedbackData, adviceData] = await Promise.all([
        getFeedback(),
        getAdvice(),
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
}));
