import {
  ExtendedInterviewAnalysis,
  useInterview,
} from "@/components/providers/InterviewContext";
import {
  uploadFile,
  generateReport,
  getRawData,
  getFeedback,
  generateWordDocument,
} from "@/lib/api";
import { InterviewAnalysis as InterviewAnalysisType } from "@/lib/types";
import { useCallback } from "react";

export function useInterviewActions() {
  const { state, dispatch } = useInterview();

  // Get total steps based on selected path
  const getTotalSteps = () => {
    // First 3 steps are common: Upload, Feedback, Path Selection
    if (!state.selectedPath) return 3;
    // All paths now have 5 steps
    return 5;
  };

  // Step management
  const setActiveStep = (step: number) => {
    dispatch({ type: "SET_STEP", payload: step });
  };

  const handleStepChange = (newStep: number) => {
    if (newStep > getTotalSteps()) return;

    if (newStep === 5 && state.activeStep === 4) {
      const humanReport: InterviewAnalysisType = {
        ...state.analysisData!,
        strengths: state.editableContent.strengths,
        areas_to_target: state.editableContent.areas_to_target,
        next_steps:
          state.selectedPath === 4 ? [] : state.editableContent.next_steps,
      };

      dispatch({
        type: "SET_ANALYSIS",
        payload: {
          ...state.analysisData!,
          humanReport,
          aiSuggestions: {
            name: state.analysisData!.name,
            date: state.analysisData!.date,
            strengths: state.analysisData!.strengths,
            areas_to_target: state.analysisData!.areas_to_target,
            next_steps: state.analysisData!.next_steps,
          },
        },
      });
    } else if (
      newStep === 4 &&
      state.activeStep === 5 &&
      state.analysisData?.humanReport
    ) {
      dispatch({
        type: "SET_EDITABLE_CONTENT",
        payload: {
          name: state.analysisData.humanReport.name,
          date: state.analysisData.humanReport.date,
          strengths: state.analysisData.humanReport.strengths,
          areas_to_target: state.analysisData.humanReport.areas_to_target,
          next_steps: state.analysisData.humanReport.next_steps,
        },
      });
    }

    setActiveStep(newStep);
  };

  // Path selection
  const setSelectedPath = (path: number) => {
    dispatch({ type: "SET_PATH", payload: path });
  };

  // Analysis data management
  const setAnalysisData = (data: ExtendedInterviewAnalysis) => {
    dispatch({ type: "SET_ANALYSIS", payload: data });
  };

  const updateAnalysisData = (data: Partial<ExtendedInterviewAnalysis>) => {
    dispatch({ type: "UPDATE_ANALYSIS", payload: data });
  };

  // File upload and processing
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    if (uploadedFile.type !== "application/pdf") {
      dispatch({ type: "SET_ERROR", payload: "Please upload a PDF file" });
      return;
    }

    dispatch({ type: "SET_FILE", payload: uploadedFile });
    dispatch({ type: "SET_ERROR", payload: "" });
    dispatch({ type: "SET_UPLOAD_PROGRESS", payload: "uploading" });

    try {
      dispatch({ type: "SET_LOADING", payload: true });
      const id = await uploadFile(uploadedFile);
      dispatch({ type: "SET_FILE_ID", payload: id });
      dispatch({ type: "SET_UPLOAD_PROGRESS", payload: "processing" });

      const data = await generateReport(id);
      setAnalysisData(data);
      handleStepChange(2);
      dispatch({ type: "SET_UPLOAD_PROGRESS", payload: null });
      dispatch({ type: "SET_RAW_DATA", payload: null });
    } catch (err) {
      dispatch({
        type: "SET_ERROR",
        payload:
          err instanceof Error
            ? err.message
            : "Failed to process the interview. Please try again.",
      });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  // Data fetching
  const fetchFeedbackData = async () => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const data = await getFeedback();
      if (!data) throw new Error("No feedback data received");
      dispatch({ type: "SET_FEEDBACK", payload: data });
    } catch (err) {
      dispatch({
        type: "SET_ERROR",
        payload:
          err instanceof Error ? err.message : "Failed to fetch feedback data",
      });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const fetchRawData = async () => {
    if (!state.fileId) return;
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const data = await getRawData(state.fileId);
      dispatch({ type: "SET_RAW_DATA", payload: data });
    } catch (err) {
      dispatch({
        type: "SET_ERROR",
        payload:
          err instanceof Error
            ? err.message
            : "Failed to fetch raw interview data",
      });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  // Document generation
  const handleDownloadWord = async () => {
    if (!state.analysisData) return;
    try {
      const baseReport: InterviewAnalysisType = {
        name: state.analysisData.name,
        date: state.analysisData.date,
        strengths: state.analysisData.strengths,
        areas_to_target: state.analysisData.areas_to_target,
        next_steps: state.analysisData.next_steps,
      };

      let reportData: InterviewAnalysisType;
      if (state.selectedPath === 1) {
        reportData = baseReport;
      } else {
        reportData = state.analysisData.humanReport || baseReport;
      }

      const blob = await generateWordDocument(reportData);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "interview-analysis.pdf";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      dispatch({
        type: "SET_ERROR",
        payload: "Failed to generate document. Please try again.",
      });
    }
  };

  // Editable content management
  const updateEditableContent = (content: Partial<InterviewAnalysisType>) => {
    dispatch({
      type: "SET_EDITABLE_CONTENT",
      payload: { ...state.editableContent, ...content },
    });
  };

  const handleAnalysisUpdate = useCallback(
    (updatedData: InterviewAnalysisType) => {
      requestAnimationFrame(() => {
        dispatch({
          type: "UPDATE_ANALYSIS",
          payload: updatedData,
        });
      });
    },
    [dispatch],
  );

  return {
    // State getters
    activeStep: state.activeStep,
    selectedPath: state.selectedPath,
    analysisData: state.analysisData,
    loading: state.loading,
    error: state.error,
    feedbackData: state.feedbackData,
    rawData: state.rawData,
    editableContent: state.editableContent,
    uploadProgress: state.uploadProgress,
    fileId: state.fileId,
    file: state.file,

    // Functions
    getTotalSteps,
    setActiveStep,
    handleStepChange,
    setSelectedPath,
    setAnalysisData,
    updateAnalysisData,
    handleFileUpload,
    fetchFeedbackData,
    fetchRawData,
    handleDownloadWord,
    updateEditableContent,
    handleAnalysisUpdate,
  };
}
