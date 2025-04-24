import React from "react";
import { useInterviewDataStore } from "@/zustand/store/interviewDataStore";
import { FeedbackData, FeedbackItem } from "@/lib/types";

interface AdviceInfo {
  role: string;
  advice: string[];
}

interface FeedbackInfo {
  role: string;
  feedback: (string | FeedbackItem)[];
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
      {/* Legend for color meaning */}
      <div className="flex items-center gap-4 mb-4 text-sm bg-gray-50 p-3 rounded-md">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
          <span>Particularly strong evidence</span>
        </div>
      </div>
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
                    {info.feedback.map((point, index: number) => {
                      try {
                        // Check if point is a string or an object with text and strong fields
                        const text = typeof point === 'string' 
                          ? point 
                          : (typeof point.text === 'string' ? point.text : JSON.stringify(point.text));
                        
                        const isStrong = typeof point !== 'string' && 
                                        point.strong && 
                                        point.strong === 'yes';
                        
                        return (
                          <li 
                            key={index} 
                            className={`${isStrong ? 'bg-green-100 border-l-4 border-green-500 pl-2 -ml-2 py-1 rounded' : 'text-gray-800'}`}
                          >
                            {text}
                          </li>
                        );
                      } catch (error) {
                        // Fallback for any rendering errors
                        console.error("Error rendering feedback item:", error, point);
                        return (
                          <li key={index} className="text-gray-800">
                            {typeof point === 'string' ? point : JSON.stringify(point)}
                          </li>
                        );
                      }
                    })}
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
                    {info.feedback.map((point, index: number) => {
                      try {
                        // Check if point is a string or an object with text and strong fields
                        const text = typeof point === 'string' 
                          ? point 
                          : (typeof point.text === 'string' ? point.text : JSON.stringify(point.text));
                        
                        const isStrong = typeof point !== 'string' && 
                                        point.strong && 
                                        point.strong === 'yes';
                        
                        return (
                          <li 
                            key={index} 
                            className={`${isStrong ? 'bg-green-100 border-l-4 border-green-500 pl-2 -ml-2 py-1 rounded' : 'text-gray-800'}`}
                          >
                            {text}
                          </li>
                        );
                      } catch (error) {
                        // Fallback for any rendering errors
                        console.error("Error rendering feedback item:", error, point);
                        return (
                          <li key={index} className="text-gray-800">
                            {typeof point === 'string' ? point : JSON.stringify(point)}
                          </li>
                        );
                      }
                    })}
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
                    {info.feedback.map((point, index: number) => {
                      try {
                        // For advice, we don't have strong field yet, so just display the text
                        const text = typeof point === 'string' ? point : JSON.stringify(point);
                        return (
                          <li key={index} className="text-gray-800">
                            {text}
                          </li>
                        );
                      } catch (error) {
                        // Fallback for any rendering errors
                        console.error("Error rendering advice item:", error, point);
                        return (
                          <li key={index} className="text-gray-800">
                            {"Error rendering advice"}
                          </li>
                        );
                      }
                    })}
                  </ul>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
