import { Button } from "@/components/ui/button";
import { SectionHeading } from "./shared/SectionHeading";
import { Plus, Trash2 } from "lucide-react";
import { useAnalysisStore } from "@/zustand/store/analysisStore";
import { useEditAnalysis } from "../../hooks/useEditAnalysis";
import { NextSteps, TemplateId } from "@/lib/types/types.analysis";
import { EditableText } from "./shared/EditableText";
import { GenerateNextStepsAi } from "./GenerateNextStepsAi";

interface EditNextSteps {
  nextSteps: NextSteps;
  templateId: TemplateId;
  aiPrompt?: boolean;
  heading?: string;
  placeholderHeading?: string;
  placeholderPoint?: string;
  placeholderTextContent?: string;
  addPointsBtnText?: string;
  addTextBtnText?: string;
  promptBtnText?: string;
}

export function EditNextSteps({
  nextSteps,
  templateId,
  aiPrompt = true,
  heading = "NEXT STEPS",
  placeholderHeading = "Enter heading...",
  placeholderPoint = "Enter text...",
  placeholderTextContent = "Enter text...",
  addPointsBtnText = "Add Points",
  addTextBtnText = "Add Text",
  promptBtnText = "Generate with AI",
}: EditNextSteps) {
  const handleAnalysisUpdate = useAnalysisStore(
    (state) => state.handleAnalysisUpdate,
  );

  const {
    handleAddTextNextStep,
    handleAddPointsNextStep,
    handleUpdateNextStep,
    handleDeleteNextStep,
    handleUpdateMainPointNextStep,
    handleUpdateSubPointNextStep,
    handleDeleteSubPointNextStep,
    handleAddSubPointNextStep,
  } = useEditAnalysis(handleAnalysisUpdate);

  return (
    <section className="mb-8">
      <SectionHeading
        title={heading}
        className="text-xl font-semibold text-gray-900"
      >
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleAddTextNextStep}>
            <Plus className="h-4 w-4 mr-1" /> {addTextBtnText}
          </Button>
          <Button variant="outline" size="sm" onClick={handleAddPointsNextStep}>
            <Plus className="h-4 w-4 mr-1" /> {addPointsBtnText}
          </Button>

          {aiPrompt && (
            <GenerateNextStepsAi
              templateId={templateId}
              btnText={promptBtnText}
            />
          )}
        </div>
      </SectionHeading>

      <div className="space-y-4">
        {nextSteps.map((step, index) => (
          <div key={index} className="space-y-2">
            {typeof step === "string" ? (
              <div className="flex gap-2">
                <EditableText
                  value={step}
                  onChange={(newValue) => handleUpdateNextStep(index, newValue)}
                  minHeight="100px"
                  placeholder={placeholderTextContent}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteNextStep(index)}
                  className="text-gray-500 hover:text-red-600  opacity-35 hover:opacity-100 transition-opacity"
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
                    placeholder={placeholderHeading}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteNextStep(index)}
                    className="text-gray-500 hover:text-red-600 opacity-35 hover:opacity-100 transition-opacity"
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
                        placeholder={placeholderPoint}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          handleDeleteSubPointNextStep(index, pointIndex)
                        }
                        className="text-gray-500 hover:text-red-600 opacity-35 hover:opacity-100 transition-opacity"
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
  );
}
