import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";
import { TemplateId } from "@/lib/types/types.analysis";
import { useInterviewDataStore } from "@/zustand/store/interviewDataStore";
import { useAnalysisStore } from "@/zustand/store/analysisStore";
import { generateNextSteps } from "@/lib/api";
import { useEditAnalysis } from "../../hooks/useEditAnalysis";

interface GenerateNextStepsAi {
  templateId: TemplateId;
  btnText?: string;
}

export function GenerateNextStepsAi({
  templateId,
  btnText = "Generate with AI",
}: GenerateNextStepsAi) {
  const fileId = useInterviewDataStore((state) => state.fileId);
  const templates = useAnalysisStore((state) => state.templates);
  const handleAnalysisUpdate = useAnalysisStore(
    (state) => state.handleAnalysisUpdate,
  );
  const { handleUpdateNextStep } = useEditAnalysis(handleAnalysisUpdate);

  const [generating, setGenerating] = useState<boolean>(false);
  // Error state for future error handling
  const [, setError] = useState<string>("");

  const content = templates[templateId];
  if (!content) {
    //TODO: handle no content scenario
    return null;
  }

  const generateAiResponse = async () => {
    if (!fileId) throw Error("fileId is required");
    if (!content) throw Error("Content is required");

    try {
      const areasToTarget = content.areas_to_target.order.reduce(
        (acc, id) => ({
          ...acc,
          [content.areas_to_target.items[id].heading]:
            content.areas_to_target.items[id].content,
        }),
        {},
      );
      const nextSteps = await generateNextSteps(areasToTarget, fileId);
      //TODO: what will happen if nextSteps is more that current Next Steps
      nextSteps.forEach((step, index) => {
        handleUpdateNextStep(index, step);
      });
    } catch (error) {
      console.error("Error generating content:", error);
      throw Error(
        error instanceof Error ? error.message : "Can not generate content",
      );
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setError("");
    try {
      await generateAiResponse();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to generate");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div>
      <Button
        onClick={handleGenerate}
        disabled={generating}
        variant="outline"
        size="sm"
        className="text-gray-500 w-auto min-w-[80px] sm:min-w-[120px] flex items-center gap-2"
      >
        {generating ? (
          <>
            <Loader2 className="animate-spin size-4" />
            <span>Generating...</span>
          </>
        ) : (
          <>
            <Sparkles className="size-4" />
            <span>{btnText}</span>
          </>
        )}
      </Button>
    </div>
  );
}
