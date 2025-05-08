import { create } from "zustand";
import { FeedbackData, AdviceData } from "@/lib/types/types.interview-data";
import { uploadFile, SortedEvidence } from "@/lib/api";
import { TemplatedData } from "@/lib/types/types.analysis";
import { handleError } from "@/lib/errorHandling";

type InterviewDataState = {
  // States
  loading: boolean;
  error: string;
  file: File | null;
  fileId: string | null;
  uploadProgress: "uploading" | "processing" | null;
  // snapshot related
  loadingSnapshot: boolean;
  // data
  manualReport: {
    sorted_by?: {
      stakeholders?: {
        feedbackData?: FeedbackData | null;
        adviceData?: AdviceData | null;
      } | null;
    };
    sorted_by_competency?: {
      sorted_strength?: SortedEvidence[];
      sorted_areas?: SortedEvidence[];
    };
  };
  fullReport?: {
    sorted_by_competency?: {
      sorted_strength?: SortedEvidence[];
      sorted_areas?: SortedEvidence[];
    };
  } | null;
  aiCompetencies?: {
    sorted_by_competency?: {
      data?: TemplatedData;
    };
  } | null;

  setFileId: (fileId: string | null) => void;
  handleSelectPdf: (
    file: File,
    callback?: () => void,
    useCache?: boolean,
  ) => Promise<void>;

  setLoadingSnapshot: (val: boolean) => void;
  // manualReport
  updateManualReportStakeHolderData: (
    feedbackData: FeedbackData | undefined | null,
    adviceData: AdviceData | undefined | null,
  ) => void;
  updateManualReportSortedCompetency: (sortedCompetency: {
    sorted_strength?: SortedEvidence[];
    sorted_areas?: SortedEvidence[];
  }) => void;
  // Full Report update functions
  setFullReport: (fullReport: InterviewDataState["fullReport"]) => void;
  updateFullReportSortedCompetency: (sortedCompetency: {
    sorted_strength?: SortedEvidence[];
    sorted_areas?: SortedEvidence[];
  }) => void;
  // ai competency update functions
  setAiCompetency: (
    aiCompetencies: InterviewDataState["aiCompetencies"],
  ) => void;
  updateAiCompetencySortedCompetency: (sortedCompetency: {
    data?: TemplatedData;
  }) => void;
};

export const useInterviewDataStore = create<InterviewDataState>((set, get) => ({
  // initial States
  loading: false,
  error: "",
  file: null,
  fileId: null,
  uploadProgress: null,
  loadingSnapshot: false,
  manualReport: {
    sorted_by: {
      stakeholders: {
        adviceData: undefined,
        feedbackData: undefined,
      },
    },
  },
  fullReport: null,
  aiCompetencies: null,

  // Handle PDF Upload
  handleSelectPdf: async (file, callback, useCache = true) => {
    const uploadedFile = file;
    set({
      loading: true,
      error: "",
      uploadProgress: "uploading",
    });
    try {
      const id = await uploadFile(uploadedFile, useCache);
      set({
        fileId: id,
        file: uploadedFile,
        uploadProgress: "processing",
      });
      if (callback) callback();
    } catch (error) {
      set({
        error: handleError(error),
      });
    } finally {
      set({ loading: false, uploadProgress: null });
    }
  },

  setFileId: (fileId: string | null) => {
    const { fileId: file_id } = get();
    if (fileId === file_id) return;
    set({
      manualReport: {
        sorted_by: {
          stakeholders: {
            adviceData: undefined,
            feedbackData: undefined,
          },
        },
      },
      file: null,
      fullReport: null,
      aiCompetencies: null,
      fileId,
    });
  },

  setLoadingSnapshot: (val) => {
    set({ loadingSnapshot: val });
  },

  // data related
  updateManualReportStakeHolderData: (feedbackData, adviceData) => {
    set((state) => ({
      manualReport: {
        ...state.manualReport,
        sorted_by: {
          ...state.manualReport.sorted_by,
          stakeholders: {
            feedbackData,
            adviceData,
          },
        },
      },
    }));
  },
  updateManualReportSortedCompetency: (sortedCompetency) => {
    set((state) => {
      if (!state.manualReport) {
        return {
          manualReport: {
            sorted_by_competency: sortedCompetency,
          },
        };
      }
      return {
        manualReport: {
          ...state.manualReport,
          sorted_by_competency: {
            ...(state.manualReport.sorted_by_competency || {}),
            ...sortedCompetency,
          },
        },
      };
    });
  },

  // Full Report update functions
  setFullReport: (fullReport) => {
    set({ fullReport });
  },
  updateFullReportSortedCompetency: (sortedCompetency) => {
    set((state) => {
      if (!state.fullReport) {
        return {
          fullReport: {
            sorted_by_competency: sortedCompetency,
          },
        };
      }
      return {
        fullReport: {
          ...state.fullReport,
          sorted_by_competency: {
            ...(state.fullReport.sorted_by_competency || {}),
            ...sortedCompetency,
          },
        },
      };
    });
  },

  // AI Competencies update functions
  setAiCompetency: (aiCompetencies) => {
    set({ aiCompetencies });
  },
  updateAiCompetencySortedCompetency: (sortedCompetency) => {
    set((state) => {
      if (!state.aiCompetencies) {
        return {
          aiCompetencies: {
            sorted_by_competency: sortedCompetency,
          },
        };
      }
      return {
        aiCompetencies: {
          ...state.aiCompetencies,
          sorted_by_competency: {
            ...(state.aiCompetencies.sorted_by_competency || {}),
            ...sortedCompetency,
          },
        },
      };
    });
  },
}));
