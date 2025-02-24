"use client";
import { FeedbackDisplay } from "../FeedbackDisplay";
import { Loader2 } from "lucide-react";
import { useInterviewDataStore } from "@/zustand/store/interviewDataStore";
import { EditableReport } from "./EditableReport";

export function ManualReportView() {
  const loading = useInterviewDataStore((state) => state.loading);
  const feedbackData = useInterviewDataStore((state) => state.feedbackData);

  if (loading) {
    return (
      <>
        <div className="grid place-items-center animate-spin w-full">
          <Loader2 />
        </div>
      </>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-8">
      <div>
        <div className="mt-4 mb-6">
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
