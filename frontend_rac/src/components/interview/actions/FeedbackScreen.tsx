"use client";
import { useInterviewAnalysis } from "@/components/providers/InterviewAnalysisContext";
import { Loader2 } from "lucide-react";
import React, { useEffect } from "react";
import { ActionWrapper } from "./ActionWrapper";
import { Button } from "@/components/ui/button";

export function FeedbackScreen() {
  const {
    loading,
    fileId,
    error,
    feedbackData: data,
    fetchFeedbackData,
  } = useInterviewAnalysis();

  useEffect(() => {
    if (fileId && !data) {
      fetchFeedbackData();
    }
  }, [data, fetchFeedbackData, fileId]);

  if (loading && !data) {
    return (
      <ActionWrapper>
        <div className="grid place-items-center animate-spin">
          <Loader2 />
        </div>
      </ActionWrapper>
    );
  }
  if (!loading && error && !data) {
    return (
      <ActionWrapper>
        <div className="grid place-items-center">
          <p className="text-red-600">{error}</p>
        </div>
      </ActionWrapper>
    );
  }
  if (!loading && !data) {
    return (
      <ActionWrapper>
        <div className="grid place-items-center">
          <p>problem in getting Feedback Data</p>
        </div>
      </ActionWrapper>
    );
  }
  if (!data) {
    return (
      <ActionWrapper>
        <div className="grid place-items-center">
          <Button
            onClick={async (e) => {
              e.preventDefault();
              await fetchFeedbackData();
            }}
          >
            Get Feedback Data
          </Button>
        </div>
      </ActionWrapper>
    );
  }

  return (
    <ActionWrapper>
      <div className="pr-4 max-h-[80vh] overflow-y-auto">
        <div className="space-y-16 pb-8">
          {/* Strengths */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-6 text-green-700 sticky top-0 bg-white py-4">
              Strengths
            </h2>
            <div className="space-y-8">
              {Object.entries(data.strengths).map(([name, info]) => (
                <div key={name} className="border-b pb-6">
                  <h3 className="text-xl font-semibold">
                    {name.replace(/_/g, " ")}
                  </h3>
                  <p className="text-gray-600 italic mb-3">{info.role}</p>
                  <ul className="list-disc pl-5 space-y-2">
                    {info.feedback.map((point, index) => (
                      <li key={index} className="text-gray-800">
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Areas to Target */}
          <div className="space-y-6 border-t pt-8">
            <h2 className="text-2xl font-bold mb-6 text-red-700 sticky top-0 bg-white py-4">
              Areas to Target
            </h2>
            <div className="space-y-8">
              {Object.entries(data.areas_to_target).map(([name, info]) => (
                <div key={name} className="border-b pb-6">
                  <h3 className="text-xl font-semibold">
                    {name.replace(/_/g, " ")}
                  </h3>
                  <p className="text-gray-600 italic mb-3">{info.role}</p>
                  <ul className="list-disc pl-5 space-y-2">
                    {info.feedback.map((point, index) => (
                      <li key={index} className="text-gray-800">
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ActionWrapper>
  );
}
