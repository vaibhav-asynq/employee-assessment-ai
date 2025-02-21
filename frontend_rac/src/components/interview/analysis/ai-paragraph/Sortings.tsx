import { useInterviewAnalysis } from "@/components/providers/InterviewAnalysisContext";
import {
  sortAreasEvidence,
  SortedEvidence,
  sortStrengthsEvidence,
} from "@/lib/api";
import { templatesIds } from "@/lib/types";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Tab } from "./AiPargraph";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowUpDown, CheckCircle2, Loader2 } from "lucide-react";
import { useValidation } from "../../hooks/useValidation";

const sortIndicatorIcons = {
  loading: <Loader2 className="h-4 w-4 mr-2 animate-spin" />,
  sorted: <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />,
  default: <ArrowUpDown className="h-4 w-4 mr-2" />,
};

type SortSection = "strengths" | "areas" | "all" | null;

interface Props {
  setSortedStrengths: Dispatch<SetStateAction<SortedEvidence[] | undefined>>;
  setSortedAreas: Dispatch<SetStateAction<SortedEvidence[] | undefined>>;
  setActiveTab: Dispatch<SetStateAction<Tab>>;
}

export function Sortings(props: Props) {
  const templateId = templatesIds.coachCometencies;

  const { activeTemplateId, templates, setActiveTemplate, fileId } =
    useInterviewAnalysis();

  const [error, setError] = useState("");

  const [sortLoading, setSortLoading] = useState<SortSection>(null);

  const [strengthsSorted, setStrengthsSorted] = useState(false);
  const [areasSorted, setAreasSorted] = useState(false);
  const [allSorted, setAllSorted] = useState(false);

  const [validStrengths, setValidStrengths] = useState(false);
  const [validAreas, setValidAreas] = useState(false);

  useEffect(() => {
    if (activeTemplateId !== templateId) {
      setActiveTemplate(templateId);
    }
  }, [activeTemplateId, setActiveTemplate, templateId]);

  const analysisWithAiCoach = templates[templateId];
  const { validateSection } = useValidation(analysisWithAiCoach);

  const sortStrengths = async () => {
    if (!fileId || !analysisWithAiCoach)
      throw Error("needed file Id and analysis data.");

    try {
      const headings = analysisWithAiCoach.strengths.order.map(
        (id) => analysisWithAiCoach.strengths.items[id].heading,
      );

      const sortedData = await sortStrengthsEvidence(fileId, headings);
      return sortedData;
    } catch (error) {
      throw error;
    }
  };

  const sortAreas = async () => {
    if (!fileId || !analysisWithAiCoach)
      throw Error("needed file Id and analysis data.");

    try {
      const headings = analysisWithAiCoach.areas_to_target.order.map(
        (id) => analysisWithAiCoach.areas_to_target.items[id].heading,
      );
      const sortedData = await sortAreasEvidence(fileId, headings);
      return sortedData;
    } catch (error) {
      throw error;
    }
  };

  const handleSortStrengths = async () => {
    try {
      setSortLoading("strengths");
      setStrengthsSorted(false);

      const sortedData = await sortStrengths();
      props.setSortedStrengths(sortedData);

      props.setActiveTab("sorted");
      setStrengthsSorted(true);
    } catch (error) {
      console.error("Error sorting strengths:", error);
      setError("Failed to sort strengths. Please try again.");
    } finally {
      setSortLoading(null);
    }
  };

  const handleSortAreas = async () => {
    try {
      setSortLoading("areas");
      setAreasSorted(false);

      const sortedData = await sortAreas();
      props.setSortedAreas(sortedData);

      props.setActiveTab("sorted");
      setAreasSorted(true);
    } catch (error) {
      console.error("Error sorting areas:", error);
      setError("Failed to sort areas. Please try again.");
    } finally {
      setSortLoading(null);
    }
  };

  const handleSortAll = async () => {
    if (!fileId || !analysisWithAiCoach) return;

    try {
      setSortLoading("all");
      setAllSorted(false);

      const [strengthsData, areasData] = await Promise.all([
        sortStrengths(),
        sortAreas(),
      ]);
      props.setSortedStrengths(strengthsData);
      props.setSortedAreas(areasData);

      // Update UI state after both operations complete
      setAllSorted(true);
      props.setActiveTab("sorted");
    } catch (error) {
      console.error("Error sorting all evidence:", error);
      setError("Failed to sort all evidence. Please try again.");
    } finally {
      setSortLoading(null);
    }
  };

  useEffect(() => {
    if (!analysisWithAiCoach) return;
    setValidAreas(validateSection("areas_to_target"));
    setValidStrengths(validateSection("strengths"));
  }, [analysisWithAiCoach, validateSection]);

  return (
    <div className="w-fit flex items-center gap-2 px-4">
      {error && <p className="mr-2 text-sm text-destructive">{error}</p>}

      <span className="text-sm font-medium text-gray-500">
        Evidence Sorting:
      </span>

      <div className="flex border divide-x ">
        <Button
          variant="ghost"
          size="sm"
          className={cn("rounded-none", strengthsSorted && "text-green-600")}
          onClick={() => handleSortStrengths()}
          disabled={!!sortLoading || !validStrengths}
        >
          {sortLoading === "strengths" || sortLoading === "all"
            ? sortIndicatorIcons.loading
            : strengthsSorted
              ? sortIndicatorIcons.sorted
              : sortIndicatorIcons.default}
          Sort Strengths
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className={cn("rounded-none", areasSorted && "text-green-600")}
          onClick={() => handleSortAreas()}
          disabled={!!sortLoading || !validAreas}
        >
          {sortLoading === "areas" || sortLoading === "all"
            ? sortIndicatorIcons.loading
            : areasSorted
              ? sortIndicatorIcons.sorted
              : sortIndicatorIcons.default}
          Sort Areas
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "rounded-none",
            strengthsSorted && areasSorted && "text-blue-600",
          )}
          onClick={() => handleSortAll()}
          disabled={!!sortLoading || !validAreas || !validStrengths}
        >
          {sortLoading === "all"
            ? sortIndicatorIcons.loading
            : allSorted
              ? sortIndicatorIcons.sorted
              : sortIndicatorIcons.default}
          Sort Both
        </Button>
      </div>
    </div>
  );
}
