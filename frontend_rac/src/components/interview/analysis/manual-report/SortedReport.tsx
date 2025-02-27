import { SortedEvidenceView } from "../sorted-evidence/SortedEvidenceView";
import { SortedEvidence } from "@/lib/api";
import { EditableReport } from "./EditableReport";

interface Props {
  sortedStrengths: SortedEvidence[] | undefined;
  sortedAreas: SortedEvidence[] | undefined;
}

export function SortedReport({ sortedStrengths, sortedAreas }: Props) {
  //TODO: find better sorting implementation

  return (
    <div className="grid grid-cols-2 gap-8 h-[calc(100vh-200px)]">
      <div className="overflow-y-auto pr-4 p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">Sorted Evidence</h2>
        </div>
        <SortedEvidenceView
          strengthsEvidence={sortedStrengths}
          areasEvidence={sortedAreas}
        />
      </div>
      <div className="border-l pl-8 overflow-y-auto p-6">
        <EditableReport />
      </div>
    </div>
  );
}
