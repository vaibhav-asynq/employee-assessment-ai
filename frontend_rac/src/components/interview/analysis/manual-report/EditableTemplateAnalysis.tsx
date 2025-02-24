import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Sparkles, Loader2 } from "lucide-react";
import { GenerateAIDialog } from "./GenerateAIDialog";
import { SectionHeading } from "../../shared/SectionHeading";
import { EditableSubheading } from "../../shared/EditableSubheading";
import { EditableText } from "../../shared/EditableText";
import { useEditAnalysis } from "../../hooks/useEditAnalysis";
import { templatesIds } from "@/lib/types";
import {
  generateStrengthContent,
  generateAreaContent,
  generateNextSteps,
} from "@/lib/api";
import { useAnalysisStore } from "@/zustand/store/analysisStore";
import { useInterviewDataStore } from "@/zustand/store/interviewDataStore";
import { EditStrengths } from "../editables/EditStrengths";
import { EditAreas } from "../editables/EditAreas";

export function EditableTemplateAnalysis() {
  const [loading, setLoading] = useState<string | null>(null);
  const [loadingNextSteps, setLoadingNextSteps] = useState(false);

  const fileId = useInterviewDataStore((state) => state.fileId);
  const templates = useAnalysisStore((state) => state.templates);
  const handleAnalysisUpdate = useAnalysisStore(
    (state) => state.handleAnalysisUpdate,
  );
  const activeTemplateId = useAnalysisStore((state) => state.activeTemplateId);
  const setActiveTemplate = useAnalysisStore(
    (state) => state.setActiveTemplate,
  );

  const {
    handleAddStrength,
    handleStrengthDelete,
    handleStrengthContentChange,
    handleStrengthHeadingChange,

    handleAddArea,
    handleAreaHeadingChange,
    handleAreaDelete,
    handleAreaContentChange,

    handleAddTextNextStep,
    handleAddPointsNextStep,
    handleUpdateNextStep,
    handleDeleteNextStep,
    handleUpdateMainPointNextStep,
    handleUpdateSubPointNextStep,
    handleDeleteSubPointNextStep,
    handleAddSubPointNextStep,
  } = useEditAnalysis(handleAnalysisUpdate);

  const templateId = templatesIds.base;

  useEffect(() => {
    if (activeTemplateId !== templateId) {
      setActiveTemplate(templateId);
    }
  }, [activeTemplateId, setActiveTemplate, templateId]);

  const analysisWithAiCoach = templates[templateId];

  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeGeneration, setActiveGeneration] = useState<{
    section: "strengths" | "areas";
    id: string;
    heading: string;
  } | null>(null);

  const onGenerate = async (suggestion: string) => {
    if (!activeGeneration || !fileId) return;
    const { section, id, heading } = activeGeneration;

    setLoading(heading);
    try {
      // Pass suggestion as existing content to API
      const content =
        section === "strengths"
          ? await generateStrengthContent(heading, fileId, suggestion)
          : await generateAreaContent(heading, fileId, suggestion);

      if (section === "strengths") {
        handleStrengthContentChange(id, content);
      } else {
        handleAreaContentChange(id, content);
      }
    } catch (error) {
      console.error("Error generating content:", error);
    } finally {
      setLoading(null);
      setActiveGeneration(null);
    }
  };

  const handleGenerateClick = (
    section: "strengths" | "areas",
    id: string,
    heading: string,
  ) => {
    setActiveGeneration({ section, id, heading });
    setDialogOpen(true);
  };

  const handleGenerateNextSteps = async () => {
    setLoadingNextSteps(true);
    try {
      if (!fileId) throw new Error("File ID is required");

      const areasToTarget = analysisWithAiCoach.areas_to_target.order.reduce(
        (acc, id) => ({
          ...acc,
          [analysisWithAiCoach.areas_to_target.items[id].heading]:
            analysisWithAiCoach.areas_to_target.items[id].content,
        }),
        {},
      );

      const nextSteps = await generateNextSteps(areasToTarget, fileId);

      // Replace existing next steps with generated ones
      nextSteps.forEach((step, index) => {
        handleUpdateNextStep(index, step);
      });
    } catch (error) {
      console.error("Error generating next steps:", error);
    } finally {
      setLoadingNextSteps(false);
    }
  };

  if (!analysisWithAiCoach) {
    return (
      <>
        <div className="grid place-items-center animate-spin w-full">
          <Loader2 />
        </div>
      </>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold tracking-tight mb-8">AI Suggestions</h2>

      {/* Strength Section */}
      <EditStrengths
        strengths={analysisWithAiCoach.strengths}
        templateId={templateId}
        propmtBtnText="Prompt"
      />

      {/* Areas to Target Section */}
      <EditAreas
        areas={analysisWithAiCoach.areas_to_target}
        templateId={templateId}
        propmtBtnText="Prompt"
      />

      {/* Next Steps Section */}
      <section className="mb-8">
        <SectionHeading
          title="NEXT STEPS"
          className="text-xl font-semibold text-gray-900"
        >
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleAddTextNextStep}>
              <Plus className="h-4 w-4 mr-1" /> Add Text
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddPointsNextStep}
            >
              <Plus className="h-4 w-4 mr-1" /> Add Points
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateNextSteps}
              disabled={loadingNextSteps}
              className="text-gray-500 whitespace-nowrap flex items-center"
            >
              {loadingNextSteps ? (
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Generate with AI
            </Button>
          </div>
        </SectionHeading>

        <div className="space-y-4">
          {analysisWithAiCoach.next_steps.map((step, index) => (
            <div key={index} className="space-y-2">
              {typeof step === "string" ? (
                <div className="flex gap-2">
                  <EditableText
                    value={step}
                    onChange={(newValue) =>
                      handleUpdateNextStep(index, newValue)
                    }
                    minHeight="100px"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteNextStep(index)}
                    className="text-gray-500 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2 w-full">
                    <input
                      type="text"
                      className="flex-1 p-2 border rounded text-lg font-semibold min-w-[500px]"
                      value={step.main}
                      onChange={(e) =>
                        handleUpdateMainPointNextStep(index, e.target.value)
                      }
                      placeholder="Enter heading..."
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteNextStep(index)}
                      className="text-gray-500 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="ml-6 space-y-2">
                    {step.sub_points.map((point, pointIndex) => (
                      <div key={pointIndex} className="flex gap-2">
                        <EditableText
                          value={point}
                          onChange={(newValue) =>
                            handleUpdateSubPointNextStep(
                              index,
                              pointIndex,
                              newValue,
                            )
                          }
                          minHeight="60px"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            handleDeleteSubPointNextStep(index, pointIndex)
                          }
                          className="text-gray-500 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddSubPointNextStep(index)}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add Sub-point
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
      <GenerateAIDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        heading={activeGeneration?.heading || ""}
        onGenerate={onGenerate}
      />
    </div>
  );
}
