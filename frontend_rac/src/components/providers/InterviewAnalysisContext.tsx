"use client";

import React, { createContext, useCallback, useContext, useState } from "react";
import { uploadFile, generateReport, getFeedback, getAdvice } from "@/lib/api";
import {
  AnalysisPath,
  FeedbackData,
  OrderedInterviewAnalysis,
  InterviewAnalysis,
  TemplateId,
  templatesIds,
} from "@/lib/types";
import { convertFromOrderedAnalysis, convertToOrderedAnalysis } from "./utils";
import { coachCompetenciesTemplate } from "@/lib/analysis/templates";

// Define the context type
interface InterviewAnalysisContextType {
  // States
  loading: boolean;
  setLoading: (loading: boolean) => void;
  file: File | null;
  setFile: (file: File | null) => void;
  uploadProgress: "uploading" | "processing" | null;
  setUploadProgress: (progress: "uploading" | "processing" | null) => void;
  error: string | null;
  setError: (msg: string | null) => void;
  fileId: string | null;
  setFileId: (id: string | null) => void;
  rawData: any;
  setRawData: (data: any) => void;
  feedbackData: FeedbackData | null;
  setFeedbackData: (data: FeedbackData | null) => void;
  adviceData: any | null;
  setAdviceData: (data: any | null) => void;
  selectedPath: AnalysisPath | null;
  setSelectedPath: (path: AnalysisPath | null) => void;

  // Templates Management
  templates: Record<TemplateId, OrderedInterviewAnalysis>;
  activeTemplateId: TemplateId | null;
  setActiveTemplate: (id: TemplateId) => void;
  addTemplate: (id: TemplateId, template: InterviewAnalysis) => void;
  removeTemplate: (id: TemplateId) => void;

  // Analysis Data Editing
  handleAnalysisUpdate: (
    updater: (prev: OrderedInterviewAnalysis) => OrderedInterviewAnalysis,
  ) => void;
  resetAnalysisToOriginal: () => void;

  // Actions
  handleSelectPdf: (
    event: React.ChangeEvent<HTMLInputElement>,
    callback?: () => void,
  ) => Promise<void>;
  fetchFeedbackData: () => Promise<void>;

  // Editing
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  pendingChanges: Partial<OrderedInterviewAnalysis>;
  saveChanges: () => Promise<void>;
  discardChanges: () => void;
}

const InterviewAnalysisContext =
  createContext<InterviewAnalysisContextType | null>(null);

export function InterviewAnalysisProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileId, setFileId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<
    "uploading" | "processing" | null
  >(null);

  const [originalTemplates, setOriginalTemplates] = useState<
    Record<TemplateId, InterviewAnalysis>
  >({
    [templatesIds.coachCometencies]: coachCompetenciesTemplate,
  });
  const [templates, setTemplates] = useState<
    Record<TemplateId, OrderedInterviewAnalysis>
  >({
    [templatesIds.coachCometencies]: convertToOrderedAnalysis(
      coachCompetenciesTemplate,
    ),
  });
  const [activeTemplateId, setActiveTemplateId] = useState<TemplateId | null>(
    null,
  );
  const [rawData, setRawData] = useState<any>(null);
  const [feedbackData, setFeedbackData] = useState<FeedbackData | null>(null);
  const [adviceData, setAdviceData] = useState<any | null>(null);
  const [selectedPath, setSelectedPath] = useState<AnalysisPath | null>(null);

  const [pendingChanges, setPendingChanges] = useState<
    Partial<OrderedInterviewAnalysis>
  >({});
  const [isEditing, setIsEditing] = useState(false);

  // Handle PDF Upload
  const handleSelectPdf = async (
    event: React.ChangeEvent<HTMLInputElement>,
    callback?: () => void,
  ) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;
    if (uploadedFile.type !== "application/pdf") {
      setError("Please upload a PDF file");
      return;
    }

    setFile(uploadedFile);
    setLoading(true);
    setError(null);
    setUploadProgress("uploading");

    try {
      const id = await uploadFile(uploadedFile);
      console.log("File uploaded, ID:", id);
      setFileId(id);
      setUploadProgress("processing");
      const data = await generateReport(id);
      console.log("Report generated:", data);

      // Add the fetched data as a new template
      const template = data;
      addTemplate(templatesIds.fullReport, template);
      // setTemplates((prev) => ({
      //   ...prev,
      //   [templateId]: template,
      // }));
      // setActiveTemplateId(templateId); // Set the newly added template as active

      setRawData(null);
      if (callback) callback();
    } catch (error) {
      console.error("Upload failed:", error);
      setError(error instanceof Error ? error.message : "Failed to upload PDF");
    } finally {
      setLoading(false);
      setUploadProgress(null);
    }
  };

  // Fetch Feedback Data
  const fetchFeedbackData = async () => {
    setLoading(true);
    try {
      if (!fileId) {
        throw new Error("No file ID available");
      }
      console.log("Fetching feedback data for file:", fileId);
      const [feedbackData, adviceData] = await Promise.all([
        getFeedback(fileId),
        getAdvice(fileId)
      ]);
      console.log("Feedback data received:", feedbackData);
      console.log("Advice data received:", adviceData);
      if (!feedbackData) {
        throw new Error("No feedback data received");
      }
      setFeedbackData(feedbackData);
      setAdviceData(adviceData);
    } catch (err) {
      console.error("Error fetching feedback data:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch feedback data",
      );
    } finally {
      setLoading(false);
    }
  };

  // Template Management
  const setActiveTemplate = useCallback(
    (id: TemplateId) => {
      if (templates[id]) {
        setActiveTemplateId(id);
      } else {
        setError(`Template with ID ${id} not found`);
      }
    },
    [templates],
  );

  const addTemplate = useCallback(
    (id: TemplateId, template: InterviewAnalysis) => {
      setOriginalTemplates((prev) => {
        if (prev[id]) {
          console.warn(
            `Template with ID ${id} already exists. Skipping addition.`,
          );
          return prev;
        }
        return {
          ...prev,
          [id]: template,
        };
      });

      setTemplates((prev) => {
        if (prev[id]) {
          console.warn(
            `Template with ID ${id} already exists. Skipping addition.`,
          );
          return prev;
        }
        return {
          ...prev,
          [id]: convertToOrderedAnalysis(template),
        };
      });

      setActiveTemplateId(id);
    },
    [],
  );

  const removeTemplate = useCallback(
    (id: TemplateId) => {
      setOriginalTemplates((prev) => {
        const { [id]: _, ...rest } = prev;
        return rest;
      });
      setTemplates((prev) => {
        const { [id]: _, ...rest } = prev;
        if (activeTemplateId === id) {
          setActiveTemplateId((Object.keys(rest)[0] as TemplateId) || null);
        }
        return rest;
      });
    },
    [activeTemplateId],
  );

  // Handle Analysis Updates
  const handleAnalysisUpdate = useCallback(
    (updater: (prev: OrderedInterviewAnalysis) => OrderedInterviewAnalysis) => {
      if (!activeTemplateId) return;

      requestAnimationFrame(() => {
        setTemplates((prev) => {
          const template = prev[activeTemplateId];
          if (!template) return prev;

          const updated = updater(template);
          setIsEditing(true);
          return {
            ...prev,
            [activeTemplateId]: updated,
          };
        });
      });
    },
    [activeTemplateId],
  );

  // Reset Analysis to Original
  const resetAnalysisToOriginal = useCallback(() => {
    if (!activeTemplateId) return;

    setTemplates((prev) => {
      const template = prev[activeTemplateId];
      if (!template) return prev;

      const original = convertToOrderedAnalysis(
        originalTemplates[activeTemplateId],
      );
      return {
        ...prev,
        [activeTemplateId]: original,
      };
    });

    setIsEditing(false);
    setError(null);
  }, [activeTemplateId, originalTemplates]);

  // Save Changes
  const saveChanges = async () => {
    if (!activeTemplateId) return;

    setLoading(true);
    try {
      const currentTemplate = templates[activeTemplateId];
      if (!currentTemplate) throw new Error("No active template found");

      // Simulate API call to save changes
      console.log("Saving changes...", currentTemplate);

      // Update raw data with saved changes
      setRawData(convertFromOrderedAnalysis(currentTemplate));
      setIsEditing(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save changes");
    } finally {
      setLoading(false);
    }
  };

  // Discard Changes
  const discardChanges = useCallback(() => {
    setPendingChanges({});
    setIsEditing(false);
  }, []);

  return (
    <InterviewAnalysisContext.Provider
      value={{
        loading,
        setLoading,
        file,
        setFile,
        uploadProgress,
        setUploadProgress,
        error,
        setError,
        fileId,
        setFileId,
        rawData,
        setRawData,
        feedbackData,
        setFeedbackData,
        adviceData,
        setAdviceData,
        selectedPath,
        setSelectedPath,
        templates,
        activeTemplateId,
        setActiveTemplate,
        addTemplate,
        removeTemplate,
        handleAnalysisUpdate,
        resetAnalysisToOriginal,
        handleSelectPdf,
        fetchFeedbackData,
        isEditing,
        setIsEditing,
        pendingChanges,
        saveChanges,
        discardChanges,
      }}
    >
      {children}
    </InterviewAnalysisContext.Provider>
  );
}

// Custom Hook
export function useInterviewAnalysis() {
  const context = useContext(InterviewAnalysisContext);

  if (!context) {
    throw new Error(
      "useInterviewAnalysis must be used within an InterviewAnalysisProvider",
    );
  }

  return context;
}
