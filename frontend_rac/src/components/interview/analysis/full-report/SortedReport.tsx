import { SortedEvidenceView } from "../sorted-evidence/SortedEvidenceView";
import { EditableAnalysis } from "./EditableAnalysis";
import { SortedEvidence } from "@/lib/api";

interface Props {
  sortedStrengths: SortedEvidence[] | undefined;
  sortedAreas: SortedEvidence[] | undefined;
}

export function SortedReport({ sortedStrengths, sortedAreas }: Props) {
  //TODO: find better sorting implementation

  return (
    <div className="grid grid-cols-2 gap-8">
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold">Sorted Evidence</h2>
        </div>
        <SortedEvidenceView
          strengthsEvidence={sortedStrengths}
          areasEvidence={sortedAreas}
        />
      </div>
      <div className="border-l pl-8">
        <EditableAnalysis />
      </div>
    </div>
  );
}
