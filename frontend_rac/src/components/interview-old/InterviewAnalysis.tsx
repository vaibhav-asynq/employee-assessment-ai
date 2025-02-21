import React, { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UploadSection } from "./UploadSection";
import { EditableAnalysis } from "./EditableAnalysis";
import { Path2Analysis } from "./Path2Analysis";
import { Path3Analysis } from "./Path3Analysis";
import { Download } from "lucide-react";
import { FeedbackScreen } from "./FeedbackScreen";
import { PathSelectionScreen } from "./PathSelectionScreen";
import { FeedbackDisplay } from "./FeedbackDisplay";
import { InterviewProvider, useInterview } from "../providers/InterviewContext";
import { useInterviewActions } from "@/lib/hooks/useInterViewActions";
import { Path2Provider } from "./context/Path2Context";

function InterviewAnalysisContent() {
  const { state, dispatch } = useInterview();
  const {
    fetchFeedbackData,
    fetchRawData,
    activeStep,
    selectedPath,
    analysisData,
    loading,
    file,
    uploadProgress,
    fileId,
    rawData,
    feedbackData,
    editableContent,
    getTotalSteps,
    setSelectedPath,
    handleFileUpload,
    handleDownloadWord,
    updateAnalysisData,
    setActiveStep,
    handleAnalysisUpdate,
    setAnalysisData,
  } = useInterviewActions();

  useEffect(() => {
    if ((activeStep === 2 || activeStep === 4) && !feedbackData) {
      fetchFeedbackData();
    }
    if (activeStep === 4 && fileId && !rawData) {
      fetchRawData();
    }
  }, [
    activeStep,
    fileId,
    rawData,
    feedbackData,
    fetchFeedbackData,
    fetchRawData,
  ]);

  const handleStepChange = (newStep: number) => {
    if (newStep > getTotalSteps()) return;

    if (newStep === 5 && activeStep === 4) {
      const humanReport = {
        ...analysisData!,
        strengths: editableContent.strengths,
        areas_to_target: editableContent.areas_to_target,
        next_steps: selectedPath === 4 ? [] : editableContent.next_steps,
      };

      dispatch({
        type: "SET_ANALYSIS",
        payload: {
          ...analysisData!,
          humanReport,
          aiSuggestions: {
            name: analysisData!.name,
            date: analysisData!.date,
            strengths: analysisData!.strengths,
            areas_to_target: analysisData!.areas_to_target,
            next_steps: analysisData!.next_steps,
          },
        },
      });
    }

    dispatch({ type: "SET_STEP", payload: newStep });
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
            <UploadSection
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
                  {state.loading ? (
                    <div className="text-center py-8">
                      <p className="text-gray-600">Loading feedback data...</p>
                    </div>
                  ) : state.feedbackData ? (
                    <FeedbackDisplay data={state.feedbackData} />
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-600">
                        No feedback data available
                      </p>
                    </div>
                  )}
                </div>
                <div className="border-l pl-8">
                  {state.analysisData && (
                    <EditableAnalysis
                      data={state.analysisData}
                      onUpdate={handleAnalysisUpdate}
                    />
                  )}
                </div>
              </div>
            ))}
          {state.activeStep === 5 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Generate Report</h2>
              <Button onClick={handleDownloadWord} className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Download Analysis as PDF Document
              </Button>
            </div>
          )}
          {state.error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{state.error}</AlertDescription>
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
      <InterviewProvider>
        <Path2Provider>
          <InterviewAnalysisContent />
        </Path2Provider>
      </InterviewProvider>
    </>
  );
}
