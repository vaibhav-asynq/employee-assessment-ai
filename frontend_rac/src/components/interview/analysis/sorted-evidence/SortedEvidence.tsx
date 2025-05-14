import React from "react";
import { type SortedEvidence } from "@/lib/api";
import { SortedEvidenceView } from "./SortedEvidenceView";
import { useInterviewDataStore } from "@/zustand/store/interviewDataStore";
import { AdviceData } from "@/lib/types/types.interview-data";

interface Props {
  sortedStrengthEvidences: SortedEvidence[];
  sortedAreasEvidences: SortedEvidence[];
}

export function SortedEvidences({
  sortedStrengthEvidences,
  sortedAreasEvidences,
}: Props) {
  const adviceData = useInterviewDataStore(
    (state) => state.adviceData,
  ) as AdviceData | null;

  // Transform advice data to match the format expected by SortedEvidenceView
  const transformedAdvice = adviceData
    ? Object.entries(adviceData).map(([name, info]) => ({
        heading: name.replace(/_/g, " "),
        evidence: info.advice.map((point: string) => ({
          quote: point,
          name: info.role,
          position: "",
        })),
      }))
    : [];
  if (!sortedAreasEvidences.length && !sortedStrengthEvidences.length) {
    return (
      <div className="grid place-items-center min-h-40">
        <p className="font-bold text-xl">sort first</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-8">
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold">Sorted Evidence</h2>
        </div>
        <SortedEvidenceView
          strengthsEvidence={sortedStrengthEvidences}
          areasEvidence={sortedAreasEvidences}
          adviceEvidence={transformedAdvice}
        />
      </div>
      <div className="border-l pl-8">
        <div className="p-4 border rounded">
          <h3 className="text-xl font-semibold mb-2">Template Analysis</h3>
          <p className="text-gray-600">Analysis content would go here.</p>
        </div>
      </div>
    </div>
  );
}
