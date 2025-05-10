import { SortedEvidenceView } from "../sorted-evidence/SortedEvidenceView";
import { SortedEvidence } from "@/lib/api";
import { EditableReport } from "./EditableReport";
import { useInterviewDataStore } from "@/zustand/store/interviewDataStore";

interface Props {
  sortedStrengths: SortedEvidence[] | undefined;
  sortedAreas: SortedEvidence[] | undefined;
}

export function SortedReport({ sortedStrengths, sortedAreas }: Props) {
  //TODO: find better sorting implementation

  // Get advice data from store
  const { manualReport } = useInterviewDataStore();
  const adviceData = manualReport.sorted_by?.stakeholders?.adviceData;

  // Transform advice data
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

  return (
    <div className="grid grid-cols-2 gap-8">
      <div className="overflow-y-auto pr-4 p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">Sorted Evidence</h2>
        </div>
        <SortedEvidenceView
          strengthsEvidence={sortedStrengths}
          areasEvidence={sortedAreas}
          adviceEvidence={transformedAdvice}
          // adviceEvidence={undefined}
        />
      </div>
      <div className="border-l pl-8 overflow-y-auto p-6">
        <EditableReport />
      </div>
    </div>
  );
}
