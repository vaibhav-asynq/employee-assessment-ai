"use client";
import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { SectionHeading } from "../../shared/SectionHeading";
import { EditableSubheading } from "../../shared/EditableSubheading";
import { EditableText } from "../../shared/EditableText";
import { templatesIds } from "@/lib/types";
import { useInterviewAnalysis } from "@/components/providers/InterviewAnalysisContext";
import { useEditAnalysis } from "../../hooks/useEditAnalysis";

export function EditableAnalysis() {
  const {
    activeTemplateId,
    templates,
    handleAnalysisUpdate,
    setActiveTemplate,
    resetAnalysisToOriginal,
  } = useInterviewAnalysis();

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

  const templateId = templatesIds.fullReport;
  useEffect(() => {
    if (activeTemplateId !== templateId) {
      setActiveTemplate(templateId);
    }
  }, [activeTemplateId, setActiveTemplate, templateId]);

  const analysisFullReport = templates[templateId];

  if (!analysisFullReport) return <p>no data</p>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold tracking-tight mb-8">AI Suggestions</h2>
      {/* INFO: may want a reset button */}
      {/* <Button */}
      {/*   variant={"ghost"} */}
      {/*   onClick={(e) => { */}
      {/*     e.preventDefault(); */}
      {/*     resetAnalysisToOriginal(); */}
      {/*   }} */}
      {/* > */}
      {/*   reset */}
      {/* </Button> */}

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

        {analysisFullReport.strengths.order.map((id) => {
          const item = analysisFullReport.strengths.items[id];
          return (
            <div key={id} className="mb-8">
              <EditableSubheading
                value={item.content}
                onChange={(newHeading) => {
                  handleStrengthHeadingChange(id, newHeading);
                }}
                onDelete={() => {
                  handleStrengthDelete(id);
                }}
              />
              <EditableText
                value={analysisFullReport.strengths.items[id].content}
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

        {analysisFullReport.areas_to_target.order.map((id) => {
          const item = analysisFullReport.areas_to_target.items[id];
          return (
            <div key={id} className="mb-8">
              <EditableSubheading
                value={item.heading}
                onChange={(newHeading) =>
                  handleAreaHeadingChange(id, newHeading)
                }
                onDelete={() => handleAreaDelete(id)}
              />
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
          </div>
        </SectionHeading>

        <div className="space-y-4">
          {analysisFullReport.next_steps.map((step, index) => (
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
