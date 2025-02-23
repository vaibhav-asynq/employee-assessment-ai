import { useInterviewAnalysis } from "@/components/providers/InterviewAnalysisContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2, WandSparkles } from "lucide-react";
import { generateReport } from "@/lib/api";
import { useState } from "react";
import { templatesIds } from "@/lib/types";
import { convertToOrderedAnalysis } from "@/components/providers/utils";

export function GenerateFullReport() {
  const {
    handleAnalysisUpdate,
    setSelectedPath,
    fileId,
    setError,
    setActiveTemplate,
    activeTemplateId,
  } = useInterviewAnalysis();

  //TODO: use react-query for data fetching

  const [generating, setGenerating] = useState(false);

  const handleGenrateFullReport = async () => {
    if (!fileId) return;
    try {
      setGenerating(true);
      const data = await generateReport(fileId);
      console.log("Report generated:", data);
      setSelectedPath("base-edit");
      if (activeTemplateId !== templatesIds.base) {
        setActiveTemplate(templatesIds.base);
      }
      const orderedData = convertToOrderedAnalysis(data);
      handleAnalysisUpdate((prev) => {
        return { ...prev, ...orderedData };
      });
    } catch (error) {
      console.error("Upload failed:", error);
      setError(error instanceof Error ? error.message : "Failed to upload PDF");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Button
      className={cn("border-foreground")}
      variant={"default"}
      disabled={generating}
      size={"sm"}
      onClick={(e) => {
        e.preventDefault();
        handleGenrateFullReport();
      }}
    >
      {generating ? (
        <div className="flex items-center gap-2">
          <Loader2 className="animate-spin" size={20} />
          <span>Generating report...</span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <WandSparkles size={18} />
          <span>Generate full report</span>
        </div>
      )}
    </Button>
  );
}
