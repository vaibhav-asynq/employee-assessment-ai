import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UploadScreen } from "./UploadSection";
import { EditableAnalysis } from "./EditableAnalysis";
import { Path2Analysis } from "./Path2Analysis";
import { Path3Analysis } from "./Path3Analysis";
import {
  uploadFile,
  generateReport,
  generateWordDocument,
  getRawData,
  getFeedback,
} from "@/lib/api";
import { InterviewAnalysis as InterviewAnalysisType } from "@/lib/types";
import { Download } from "lucide-react";
import { FeedbackScreen } from "./FeedbackScreen";
import { PathSelectionScreen } from "./PathSelectionScreen";
import { DevelopmentalResources } from "./DevelopmentalResources";
import { FeedbackDisplay } from "./FeedbackDisplay";
import { Path2Provider } from "./context/Path2Context";

interface ExtendedInterviewAnalysis extends InterviewAnalysisType {
  humanReport?: InterviewAnalysisType;
  aiSuggestions?: InterviewAnalysisType;
}

function InterviewAnalysisContent() {
  const [activeStep, setActiveStep] = useState(1);
  const [selectedPath, setSelectedPath] = useState<number | null>(null);
  const [feedbackData, setFeedbackData] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [analysisData, setAnalysisData] =
    useState<ExtendedInterviewAnalysis | null>(null);
  const [rawData, setRawData] = useState<any>(null);
  const [uploadProgress, setUploadProgress] = useState<
    "uploading" | "processing" | null
  >(null);
  const [fileId, setFileId] = useState<string | null>(null);
  const [editableContent, setEditableContent] = useState<InterviewAnalysisType>(
    {
      name: "",
      date: new Date().toISOString(),
      strengths: {},
      areas_to_target: {},
      next_steps: [],
    },
  );

  // Initialize editable content when raw data changes
  useEffect(() => {
    if (rawData && analysisData) {
      if (Object.keys(editableContent.strengths).length === 0) {
        setEditableContent((prev) => ({
          ...prev,
          strengths: Object.fromEntries(
            Object.keys(analysisData.strengths).map((key) => [key, ""]),
          ),
          areas_to_target: Object.fromEntries(
            Object.keys(analysisData.areas_to_target).map((key) => [key, ""]),
          ),
        }));
      }
    }
  }, [rawData, analysisData, editableContent.strengths]);

  useEffect(() => {
    if (analysisData && editableContent.next_steps.length === 0) {
      setEditableContent((prev) => ({
        ...prev,
        next_steps: analysisData.next_steps,
      }));
    }
  }, [analysisData, editableContent.next_steps.length]);

  useEffect(() => {
    if ((activeStep === 2 || activeStep === 4) && !feedbackData) {
      fetchFeedbackData();
    }
    if (activeStep === 4 && fileId && !rawData) {
      fetchRawData();
    }
  }, [activeStep, fileId, rawData, feedbackData]);

  const fetchFeedbackData = async () => {
    setLoading(true);
    try {
      console.log("Fetching feedback data...");
      const data = await getFeedback();
      console.log("Feedback data received:", data);
      if (!data) {
        throw new Error("No feedback data received");
      }
      setFeedbackData(data);
    } catch (err) {
      console.error("Error fetching feedback data:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch feedback data",
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchRawData = async () => {
    if (!fileId) return;
    setLoading(true);
    try {
      console.log("Fetching raw data for fileId:", fileId);
      const data = await getRawData(fileId);
      console.log("Raw data received:", data);
      setRawData(data);
    } catch (err) {
      console.error("Error fetching raw data:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch raw interview data. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    if (uploadedFile.type !== "application/pdf") {
      setError("Please upload a PDF file");
      return;
    }
    setFile(uploadedFile);
    setError("");
    setUploadProgress("uploading");

    try {
      setLoading(true);
      const id = await uploadFile(uploadedFile);
      console.log("File uploaded, ID:", id);
      setFileId(id);
      setUploadProgress("processing");
      const data = await generateReport(id);
      console.log("Report generated:", data);
      setAnalysisData(data);
      setActiveStep(2);
      setUploadProgress(null);
      setRawData(null);
    } catch (err) {
      console.error("Error during file upload or report generation:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to process the interview. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadWord = async () => {
    if (!analysisData) return;
    try {
      // Create a base report data object
      const baseReport: InterviewAnalysisType = {
        name: analysisData.name,
        date: analysisData.date,
        strengths: analysisData.strengths,
        areas_to_target: analysisData.areas_to_target,
        next_steps: analysisData.next_steps,
      };

      // For Path 1, use the base report (AI suggestions)
      // For other paths, use the human report if available
      let reportData: InterviewAnalysisType;
      if (selectedPath === 1) {
        reportData = baseReport;
      } else {
        reportData = analysisData.humanReport || baseReport;
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
      setError("Failed to generate document. Please try again.");
    }
  };

  const handleStepChange = (newStep: number) => {
    if (newStep > getTotalSteps()) return;

    if (newStep === 5 && activeStep === 4) {
      // For all paths, prepare the report data
      const humanReport: InterviewAnalysisType = {
        ...analysisData!,
        strengths: editableContent.strengths,
        areas_to_target: editableContent.areas_to_target,
        next_steps: selectedPath === 4 ? [] : editableContent.next_steps,
      };

      setAnalysisData({
        ...analysisData!,
        humanReport,
        aiSuggestions: {
          name: analysisData!.name,
          date: analysisData!.date,
          strengths: analysisData!.strengths,
          areas_to_target: analysisData!.areas_to_target,
          next_steps: analysisData!.next_steps,
        },
      });
    } else if (newStep === 4 && activeStep === 5 && analysisData?.humanReport) {
      setEditableContent({
        name: analysisData.humanReport.name,
        date: analysisData.humanReport.date,
        strengths: analysisData.humanReport.strengths,
        areas_to_target: analysisData.humanReport.areas_to_target,
        next_steps: analysisData.humanReport.next_steps,
      });
    }
    setActiveStep(newStep);
  };

  const handleAnalysisUpdate = useCallback(
    (updatedData: InterviewAnalysisType) => {
      requestAnimationFrame(() => {
        setAnalysisData((prev) => ({
          ...prev!,
          ...updatedData,
        }));
      });
    },
    [],
  );

  const getTotalSteps = () => {
    // First 3 steps are common: Upload, Feedback, Path Selection
    if (!selectedPath) return 3;

    // All paths now have 5 steps:
    // Upload -> Feedback -> Path Selection -> Split Screen -> Generate Report
    return 5;
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Interview Analysis Dashboard
        </h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleStepChange(Math.max(1, activeStep - 1))}
            disabled={activeStep === 1}
          >
            Previous
          </Button>
          <Button
            onClick={() => handleStepChange(activeStep + 1)}
            disabled={activeStep === getTotalSteps() || !analysisData}
          >
            Next
          </Button>
        </div>
      </div>
      <div
        className="grid gap-2 mb-8"
        style={{
          gridTemplateColumns: `repeat(${getTotalSteps()}, minmax(0, 1fr))`,
        }}
      >
        {Array.from({ length: getTotalSteps() }).map((_, index) => (
          <div
            key={index + 1}
            className={`h-2 rounded ${
              index + 1 <= activeStep ? "bg-blue-500" : "bg-gray-200"
            }`}
          />
        ))}
      </div>
      <Card>
        <CardContent className="p-6">
          {activeStep === 1 && (
            <UploadScreen
              loading={loading}
              file={file}
              onFileUpload={handleFileUpload}
              uploadProgress={uploadProgress}
            />
          )}
          {activeStep === 2 && feedbackData && (
            <FeedbackScreen data={feedbackData} />
          )}
          {activeStep === 3 && (
            <PathSelectionScreen
              onSelectPath={(path) => {
                setSelectedPath(path);
                setActiveStep(4);
              }}
            />
          )}
          {activeStep === 4 &&
            (selectedPath === 2 ? (
              <Path2Analysis />
            ) : selectedPath === 3 ? (
              <Path3Analysis
                feedbackData={feedbackData}
                loading={loading}
                fileId={fileId}
                onUpdate={(updatedData) => {
                  setAnalysisData((prev) => ({
                    ...prev!,
                    ...updatedData,
                  }));
                }}
              />
            ) : (
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold">Interview Feedback</h2>
                  </div>
                  {loading ? (
                    <div className="text-center py-8">
                      <p className="text-gray-600">Loading feedback data...</p>
                    </div>
                  ) : feedbackData ? (
                    <FeedbackDisplay data={feedbackData} />
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-600">
                        No feedback data available
                      </p>
                    </div>
                  )}
                </div>
                <div className="border-l pl-8">
                  {analysisData && (
                    <EditableAnalysis
                      data={analysisData}
                      onUpdate={handleAnalysisUpdate}
                    />
                  )}
                </div>
              </div>
            ))}
          {activeStep === 5 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Generate Report</h2>
              <Button onClick={handleDownloadWord} className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Download Analysis as PDF Document
              </Button>
            </div>
          )}
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function InterviewAnalysis() {
  return (
    <>
      {/* <Path2Provider> */}
      <InterviewAnalysisContent />
      {/* </Path2Provider> */}
    </>
  );
}
