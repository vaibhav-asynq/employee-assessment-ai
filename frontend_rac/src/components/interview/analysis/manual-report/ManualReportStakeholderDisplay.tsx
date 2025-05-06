import React, { useCallback, useEffect } from "react";
import { useInterviewDataStore } from "@/zustand/store/interviewDataStore";
import { useManulReportStakeholderData } from "@/lib/react-query";
import { Advice, AdviceInfo } from "@/lib/types/types.interview-data";
import { Loader2, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSnapshotLoader } from "@/hooks/useSnapshotLoader";

export function ManualReportStakeholderDisplay() {
  const {
    manualReport,
    loadingSnapshot,
    updateManualReportStakeHolderData,
    fileId,
    error,
  } = useInterviewDataStore();
  const { latestFetching, latestRefetching } = useSnapshotLoader();

  const { refetch, isFetching, isLoading, isRefetching, isError } =
    useManulReportStakeholderData(fileId, {
      enabled: false,
    });

  const loading = isLoading || isFetching || isRefetching || loadingSnapshot;

  const feedbackData = manualReport.sorted_by?.stakeholders?.feedbackData;
  const adviceData = manualReport.sorted_by?.stakeholders?.adviceData;

  // Transform advice data to match feedback format
  interface TransformedAdviceData {
    role: string;
    feedback: Advice[];
  }
  const transformedAdvice = adviceData
    ? Object.entries(adviceData).reduce(
        (
          acc: Record<string, TransformedAdviceData>,
          [name, info]: [string, AdviceInfo],
        ) => {
          acc[name] = {
            role: info.role,
            feedback: info.advice, // advice array becomes feedback array
          };
          return acc;
        },
        {},
      )
    : null;

  const refetchData = useCallback(async () => {
    const d = await refetch();
    updateManualReportStakeHolderData(d.data?.feedbackData, d.data?.adviceData);
  }, [refetch, updateManualReportStakeHolderData]);

  useEffect(() => {
    // THIS LOADS DATA: if not found in snapshot or initial file loading
    if (loadingSnapshot) return;
    if (latestFetching || latestRefetching || isFetching || isLoading) return;
    if (manualReport.sorted_by?.stakeholders?.feedbackData) return;
    refetchData();
  }, [
    isFetching,
    isLoading,
    latestFetching,
    latestRefetching,
    loadingSnapshot,
    manualReport.sorted_by?.stakeholders?.feedbackData,
    refetchData,
  ]);

  if (loading || !feedbackData) {
    return (
      <div className="grid place-items-center animate-spin">
        <Loader2 />
      </div>
    );
  }

  if (!loading && isError) {
    return (
      <div className="grid place-items-center">
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <p className="text-xl font-semibold text-red-600">
            Error Loading Data
          </p>
          <p className="text-red-600">{error}</p>
          <Button
            onClick={async () => await refetchData()}
            className="mt-4 flex gap-2 items-center"
          >
            <RotateCw size={16} />
            <span>Refetch data</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-8">
        {/* Strengths */}
        <div>
          <div className="flex justify-between">
            <h3 className="text-2xl font-semibold mb-4 text-emerald-600">
              Strengths
            </h3>
            <div></div>
          </div>
          <div className="space-y-6">
            {feedbackData?.strengths &&
              Object.entries(feedbackData.strengths).map(([name, info]) => (
                <div key={name} className="border-b pb-6">
                  <h4 className="font-semibold mb-2">
                    {name.replace(/_/g, " ")}
                  </h4>
                  <p className="text-gray-600 italic mb-3">{info.role}</p>
                  <ul className="list-disc pl-5 space-y-2">
                    {info.feedback.map((point, index: number) => {
                      const text =
                        typeof point === "string" ? point : point.text;
                      const isStrong =
                        typeof point === "object" ? point.is_strong : false;

                      return (
                        <li
                          key={index}
                          className={`text-gray-800 ${isStrong ? "pl-2 border-l-4 border-green-500 bg-green-50" : ""}`}
                        >
                          {text}
                        </li>
                      );
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
            {feedbackData?.areas_to_target &&
              Object.entries(feedbackData.areas_to_target).map(
                ([name, info]) => (
                  <div key={name} className="border-b pb-6">
                    <h4 className="font-semibold mb-2">
                      {name.replace(/_/g, " ")}
                    </h4>
                    <p className="text-gray-600 italic mb-3">{info.role}</p>
                    <ul className="list-disc pl-5 space-y-2">
                      {info.feedback.map((point, index: number) => {
                        const text =
                          typeof point === "string" ? point : point.text;
                        const isStrong =
                          typeof point === "object" ? point.is_strong : false;

                        return (
                          <li
                            key={index}
                            className={`text-gray-800 ${isStrong ? "pl-2 border-l-4 border-red-500 bg-red-50" : ""}`}
                          >
                            {text}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ),
              )}
          </div>
        </div>

        {/* Advice */}

        {transformedAdvice && Object.entries(transformedAdvice).length && (
          <div>
            <h3 className="text-2xl font-semibold mb-4 text-indigo-600">
              Advice
            </h3>
            <div className="space-y-6">
              {Object.entries(transformedAdvice).map(([name, info]) => (
                <div key={name} className="border-b pb-6">
                  <h4 className="font-semibold mb-2">
                    {name.replace(/_/g, " ")}
                  </h4>
                  <p className="text-gray-600 italic mb-3">{info.role}</p>
                  <ul className="list-disc pl-5 space-y-2">
                    {info.feedback.map((point, index: number) => {
                      const text =
                        typeof point === "string" ? point : point.text;
                      const isStrong =
                        typeof point === "object" ? point.is_strong : false;

                      return (
                        <li key={index} className="text-gray-800">
                          {text}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
