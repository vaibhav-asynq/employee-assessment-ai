"use client";
import { useInterviewAnalysis } from "@/components/providers/InterviewAnalysisContext";
import { FeedbackDisplay } from "../FeedbackDisplay";
import { EditableAnalysis } from "./EditableAnalysis";
import { useEffect } from "react";
import { templatesIds } from "@/lib/types";

export function FullReport() {
  const { setActiveTemplate, loading, activeTemplateId, feedbackData } =
    useInterviewAnalysis();

  useEffect(() => {
    if (activeTemplateId !== templatesIds.fullReport) {
      setActiveTemplate(templatesIds.fullReport);
    }
  }, [activeTemplateId, setActiveTemplate]);

  return (
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
            <p className="text-gray-600">No feedback data available</p>
          </div>
        )}
      </div>
      <div className="border-l pl-8">
        <EditableAnalysis />
      </div>
    </div>
  );
}
