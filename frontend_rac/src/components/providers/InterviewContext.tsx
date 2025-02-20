"use client"
import React, { createContext, useContext, useReducer, ReactNode } from "react";
import { InterviewAnalysis as InterviewAnalysisType } from "@/lib/types";

export interface ExtendedInterviewAnalysis extends InterviewAnalysisType {
  humanReport?: InterviewAnalysisType;
  aiSuggestions?: InterviewAnalysisType;
}

interface State {
  activeStep: number;
  selectedPath: number | null;
  feedbackData: any | null;
  file: File | null;
  loading: boolean;
  error: string;
  analysisData: ExtendedInterviewAnalysis | null;
  rawData: any | null;
  uploadProgress: "uploading" | "processing" | null;
  fileId: string | null;
  editableContent: InterviewAnalysisType;
}

type Action =
  | { type: "SET_STEP"; payload: number }
  | { type: "SET_PATH"; payload: number }
  | { type: "SET_FEEDBACK"; payload: any }
  | { type: "SET_FILE"; payload: File | null }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string }
  | { type: "SET_ANALYSIS"; payload: ExtendedInterviewAnalysis }
  | { type: "SET_RAW_DATA"; payload: any }
  | { type: "SET_UPLOAD_PROGRESS"; payload: "uploading" | "processing" | null }
  | { type: "SET_FILE_ID"; payload: string }
  | { type: "SET_EDITABLE_CONTENT"; payload: InterviewAnalysisType }
  | { type: "UPDATE_ANALYSIS"; payload: Partial<ExtendedInterviewAnalysis> };

const initialState: State = {
  activeStep: 1,
  selectedPath: null,
  feedbackData: null,
  file: null,
  loading: false,
  error: "",
  analysisData: null,
  rawData: null,
  uploadProgress: null,
  fileId: null,
  editableContent: {
    name: "",
    date: new Date().toISOString(),
    strengths: {},
    areas_to_target: {},
    next_steps: [],
  },
};

const InterviewContext = createContext<
  | {
      state: State;
      dispatch: React.Dispatch<Action>;
    }
  | undefined
>(undefined);

function interviewReducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_STEP":
      return { ...state, activeStep: action.payload };
    case "SET_PATH":
      return { ...state, selectedPath: action.payload };
    case "SET_FEEDBACK":
      return { ...state, feedbackData: action.payload };
    case "SET_FILE":
      return { ...state, file: action.payload };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "SET_ANALYSIS":
      return { ...state, analysisData: action.payload };
    case "UPDATE_ANALYSIS":
      return {
        ...state,
        analysisData: state.analysisData
          ? { ...state.analysisData, ...action.payload }
          : null,
      };
    case "SET_RAW_DATA":
      return { ...state, rawData: action.payload };
    case "SET_UPLOAD_PROGRESS":
      return { ...state, uploadProgress: action.payload };
    case "SET_FILE_ID":
      return { ...state, fileId: action.payload };
    case "SET_EDITABLE_CONTENT":
      return { ...state, editableContent: action.payload };
    default:
      return state;
  }
}

export function InterviewProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(interviewReducer, initialState);

  return (
    <InterviewContext.Provider value={{ state, dispatch }}>
      {children}
    </InterviewContext.Provider>
  );
}

export function useInterview() {
  const context = useContext(InterviewContext);
  if (context === undefined) {
    throw new Error("useInterview must be used within an InterviewProvider");
  }
  return context;
}
