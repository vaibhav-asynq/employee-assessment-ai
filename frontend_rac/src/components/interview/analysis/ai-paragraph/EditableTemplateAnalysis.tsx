import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Sparkles, Loader2 } from "lucide-react";
import { SectionHeading } from "../../shared/SectionHeading";
import { EditableSubheading } from "../../shared/EditableSubheading";
import { EditableText } from "../../shared/EditableText";
import { useInterviewAnalysis } from "@/components/providers/InterviewAnalysisContext";
import { useEditAnalysis } from "../../hooks/useEditAnalysis";
import { templatesIds } from "@/lib/types";
import { generateStrengthContent, generateAreaContent, generateNextSteps } from "@/lib/api";

export function EditableTemplateAnalysis() {
  const {
    activeTemplateId,
    templates,
    handleAnalysisUpdate,
    setActiveTemplate,
    fileId,
    selectedPath
  } = useInterviewAnalysis();

  const [loading, setLoading] = useState<string | null>(null);
  const [loadingNextSteps, setLoadingNextSteps] = useState(false);

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

  const templateId = selectedPath === 1 
    ? templatesIds.coachCometencies 
    : templatesIds.fullReport;
  useEffect(() => {
    if (activeTemplateId !== templateId) {
      setActiveTemplate(templateId);
    }
  }, [activeTemplateId, setActiveTemplate, templateId]);

  const analysisWithAiCoach = templates[templateId];

  const onGenerate = async (section: "strengths" | "areas", id: string, heading: string) => {
    setLoading(heading);
    try {
      if (!fileId) throw new Error("File ID is required");
      
      // Get existing content based on section type
      const existingContent = section === "strengths" 
        ? analysisWithAiCoach.strengths.items[id].content
        : analysisWithAiCoach.areas_to_target.items[id].content;
      
      // Pass existing content to API
      const content = section === "strengths" 
        ? await generateStrengthContent(heading, fileId, existingContent)
        : await generateAreaContent(heading, fileId, existingContent);
        
      if (section === "strengths") {
        handleStrengthContentChange(id, content);
      } else {
        handleAreaContentChange(id, content);
      }
    } catch (error) {
      console.error("Error generating content:", error);
    } finally {
      setLoading(null);
    }
  };

  const handleGenerateNextSteps = async () => {
    setLoadingNextSteps(true);
    try {
      if (!fileId) throw new Error("File ID is required");
      
      const areasToTarget = analysisWithAiCoach.areas_to_target.order.reduce(
        (acc, id) => ({
          ...acc,
          [analysisWithAiCoach.areas_to_target.items[id].heading]: 
          analysisWithAiCoach.areas_to_target.items[id].content
        }),
        {}
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

      {/* Strengths Section */}
      <section className="mb-8">
        <SectionHeading
          title="STRENGTHS"
          className="text-xl font-semibold text-gray-900"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAddStrength()}
          >
            <Plus className="h-4 w-4 mr-1" /> Add Subheading
          </Button>
        </SectionHeading>
        {analysisWithAiCoach.strengths.order.map((id) => {
          const item = analysisWithAiCoach.strengths.items[id];
          return (
            <div key={id} className="mb-8">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1">
                  <EditableSubheading
                    value={item.heading}
                    onChange={(newHeading) => {
                      handleStrengthHeadingChange(id, newHeading);
                    }}
                    onDelete={() => {
                      handleStrengthDelete(id);
                    }}
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onGenerate("strengths", id, item.heading)}
                  disabled={loading === item.heading}
                  className="text-gray-500 whitespace-nowrap flex items-center"
                >
                  {loading === item.heading ? (
                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  Generate with AI
                </Button>
              </div>
              <EditableText
                value={item.content}
                onChange={(newContent) => {
                  handleStrengthContentChange(id, newContent);
                }}
                minHeight="180px"
              />
            </div>
          );
        })}
      </section>

      {/* Areas to Target Section */}
      <section className="mb-8">
        <SectionHeading
          title="AREAS TO TARGET"
          className="text-xl font-semibold text-gray-900"
        >
          <Button variant="outline" size="sm" onClick={() => handleAddArea()}>
            <Plus className="h-4 w-4 mr-1" /> Add Subheading
          </Button>
        </SectionHeading>
        {analysisWithAiCoach.areas_to_target.order.map((id) => {
          const item = analysisWithAiCoach.areas_to_target.items[id];
          return (
            <div key={id} className="mb-8">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1">
                  <EditableSubheading
                    value={item.heading}
                    onChange={(newHeading) =>
                      handleAreaHeadingChange(id, newHeading)
                    }
                    onDelete={() => handleAreaDelete(id)}
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onGenerate("areas", id, item.heading)}
                  disabled={loading === item.heading}
                  className="text-gray-500 whitespace-nowrap flex items-center"
                >
                  {loading === item.heading ? (
                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  Generate with AI
                </Button>
              </div>
              <EditableText
                value={item.content}
                onChange={(newContent) =>
                  handleAreaContentChange(id, newContent)
                }
                minHeight="180px"
              />
            </div>
          );
        })}
      </section>

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
    </div>
  );
}
