"use client";
import { FeedbackDisplay } from "../FeedbackDisplay";
import { useEffect } from "react";
import { templatesIds } from "@/lib/types";
import { useInterviewDataStore } from "@/zustand/store/interviewDataStore";
import { useAnalysisStore } from "@/zustand/store/analysisStore";
import { EditableReport } from "./EditableReport";

export function FullReportView() {
  const loading = useInterviewDataStore((state) => state.loading);
  const feedbackData = useInterviewDataStore((state) => state.feedbackData);
  const activeTemplateId = useAnalysisStore((state) => state.activeTemplateId);
  const setActiveTemplate = useAnalysisStore(
    (state) => state.setActiveTemplate,
  );

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
        <EditableReport />
      </div>
    </div>
  );
}
