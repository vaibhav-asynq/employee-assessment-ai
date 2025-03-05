import React from "react";
import { useInterviewDataStore } from "@/zustand/store/interviewDataStore";

interface AdviceInfo {
  role: string;
  advice: string[];
}

interface FeedbackInfo {
  role: string;
  feedback: string[];
}

interface FeedbackData {
  strengths: {
    [key: string]: FeedbackInfo;
  };
  areas_to_target: {
    [key: string]: FeedbackInfo;
  };
}

interface FeedbackDisplayProps {
  data: FeedbackData;
}

export function FeedbackDisplay({ data }: FeedbackDisplayProps) {
  const adviceData = useInterviewDataStore((state) => state.adviceData);

  // Transform advice data to match feedback format
  const transformedAdvice: Record<string, FeedbackInfo> | null = adviceData
    ? Object.entries(adviceData as Record<string, AdviceInfo>).reduce(
        (acc: Record<string, FeedbackInfo>, [name, info]: [string, AdviceInfo]) => {
          acc[name] = {
            role: info.role,
            feedback: info.advice, // advice array becomes feedback array
          };
          return acc;
        },
        {}
      )
    : null;

  return (
    <div>
      <div className="space-y-8">
        {/* Strengths */}
        <div>
          <h3 className="text-2xl font-semibold mb-4 text-emerald-600">
            Strengths
          </h3>
          <div className="space-y-6">
            {data?.strengths &&
              Object.entries(data.strengths).map(([name, info]) => (
                <div key={name} className="border-b pb-6">
                  <h4 className="font-semibold mb-2">
                    {name.replace(/_/g, " ")}
                  </h4>
                  <p className="text-gray-600 italic mb-3">{info.role}</p>
                  <ul className="list-disc pl-5 space-y-2">
                    {info.feedback.map((point: string, index: number) => (
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
        <div>
          <h3 className="text-2xl font-semibold mb-4 text-amber-600">
            Areas to Target
          </h3>
          <div className="space-y-6">
            {data?.areas_to_target &&
              Object.entries(data.areas_to_target).map(([name, info]) => (
                <div key={name} className="border-b pb-6">
                  <h4 className="font-semibold mb-2">
                    {name.replace(/_/g, " ")}
                  </h4>
                  <p className="text-gray-600 italic mb-3">{info.role}</p>
                  <ul className="list-disc pl-5 space-y-2">
                    {info.feedback.map((point: string, index: number) => (
                      <li key={index} className="text-gray-800">
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
          </div>
        </div>

        {/* Advice */}
        <div>
          <h3 className="text-2xl font-semibold mb-4 text-indigo-600">
            Advice
          </h3>
          <div className="space-y-6">
            {transformedAdvice &&
              Object.entries(transformedAdvice).map(([name, info]) => (
                <div key={name} className="border-b pb-6">
                  <h4 className="font-semibold mb-2">
                    {name.replace(/_/g, " ")}
                  </h4>
                  <p className="text-gray-600 italic mb-3">{info.role}</p>
                  <ul className="list-disc pl-5 space-y-2">
                    {info.feedback.map((point: string, index: number) => (
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
  );
}
