import React from "react";
import { type SortedEvidence } from "@/lib/api";
import { SortedEvidenceView } from "./SortedEvidenceView";
import { EditableTemplateAnalysis } from "../base-edit/EditableTemplateAnalysis";

interface Props {
  sortedStrengthEvidences: SortedEvidence[];
  sortedAreasEvidences: SortedEvidence[];
}

export function SortedEvidences({
  sortedStrengthEvidences,
  sortedAreasEvidences,
}: Props) {
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
        />
      </div>
      <div className="border-l pl-8">
        <EditableTemplateAnalysis />
      </div>
    </div>
  );
}
