import React from "react";
import { Card } from "@/components/ui/card";
import { EditableSubheading } from "../../shared/EditableSubheading";
import { EditableText } from "../../shared/EditableText";
import { SectionHeading } from "../../shared/SectionHeading";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { templatesIds } from "@/lib/types";
import { useEditAnalysis } from "../../hooks/useEditAnalysis";
import { useAnalysisStore } from "@/zustand/store/analysisStore";

export function Path2HumanReport() {
  const templates = useAnalysisStore((state) => state.templates);
  const handleAnalysisUpdate = useAnalysisStore(
    (state) => state.handleAnalysisUpdate,
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
  const templateId = templatesIds.coachParagraph;

  const analysisCoachParagraph = templates[templateId];

  if (!analysisCoachParagraph || !templates[templateId]) {
    //TODO: add more meaningful messages and add buttons to go to specific steps
    return null;
  }

  return (
    <div className="p-6">
      {/* Strengths Section */}
      <section className="mb-8">
        <SectionHeading
          title="Leadership Qualities"
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

        <div className="space-y-6">
          {analysisCoachParagraph.strengths.order.map((id) => {
            const item = analysisCoachParagraph.strengths.items[id];
            return (
              <Card key={id} className="p-4">
                <EditableSubheading
                  value={item.heading}
                  onChange={(newHeading) => {
                    handleStrengthHeadingChange(id, newHeading);
                  }}
                  onDelete={() => {
                    handleStrengthDelete(id);
                  }}
                />
                <EditableText
                  value={item.content}
                  onChange={(newContent) => {
                    handleStrengthContentChange(id, newContent);
                  }}
                  placeholder="Enter content here..."
                />
              </Card>
            );
          })}
        </div>
      </section>

      {/* Areas to Target Section */}
      <section className="mb-8">
        <SectionHeading
          title="Areas of Development"
          className="text-xl font-semibold text-gray-900"
        >
          <Button variant="outline" size="sm" onClick={() => handleAddArea()}>
            <Plus className="h-4 w-4 mr-1" /> Add Subheading
          </Button>
        </SectionHeading>

        <div className="space-y-6">
          {analysisCoachParagraph.areas_to_target.order.map((id) => {
            const item = analysisCoachParagraph.areas_to_target.items[id];
            return (
              <Card key={id} className="p-4">
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
                  placeholder="Enter content here..."
                />
              </Card>
            );
          })}
        </div>
      </section>

      {/* Next Steps Section */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Next Steps</h2>
          <div className="space-x-2">
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
        </div>

        <div className="space-y-4">
          {analysisCoachParagraph.next_steps.map((step, index) => (
            <Card key={index} className="p-4 relative">
              {typeof step === "string" ? (
                <div>
                  <EditableText
                    value={step}
                    onChange={(newValue) =>
                      handleUpdateNextStep(index, newValue)
                    }
                    placeholder="Enter text..."
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 hover:text-red-600"
                    onClick={() => handleDeleteNextStep(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div>
                  <EditableText
                    value={step.main}
                    onChange={(content) =>
                      handleUpdateMainPointNextStep(index, content)
                    }
                    placeholder="Enter main point..."
                  />
                  <div className="ml-6 mt-2 space-y-2">
                    {step.sub_points.map((point, pointIndex) => (
                      <div key={pointIndex} className="flex items-start gap-2">
                        <EditableText
                          value={point}
                          onChange={(newValue) =>
                            handleUpdateSubPointNextStep(
                              index,
                              pointIndex,
                              newValue,
                            )
                          }
                          placeholder="Enter sub-point..."
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleDeleteSubPointNextStep(index, pointIndex)
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAddSubPointNextStep(index)}
                      className="mt-2"
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add Sub-point
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => handleDeleteNextStep(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
