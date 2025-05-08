import { Button } from "@/components/ui/button";
import { SectionHeading } from "./shared/SectionHeading";
import { Plus, Trash2 } from "lucide-react";
import { NextSteps, TemplateId } from "@/lib/types/types.analysis";
import { EditableText } from "./shared/EditableText";
import { GenerateNextStepsAi } from "./GenerateNextStepsAi";
import { useTemplateUpdater } from "@/hooks/useTemplateUpdater";
import { useDebounce } from "@/lib/utils/debounce";
import { useCallback } from "react";
import { EditableSubheading } from "./shared/EditableSubheading";

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
  const {
    addTextNextStep,
    addPointsNextStep,
    updateNextStep,
    deleteNextStep,
    updateMainPointNextStep,
    updateSubPointNextStep,
    deleteSubPointNextStep,
    addSubPointNextStep,
  } = useTemplateUpdater();

  // Debounced handler for main point updates
  const debouncedUpdateMainPoint = useDebounce(
    (index: number, value: string) => {
      updateMainPointNextStep(index, value);
    },
    300,
    [updateMainPointNextStep],
  );

  // Handler for main point input changes
  const handleMainPointChange = useCallback(
    (index: number, value: string) => {
      debouncedUpdateMainPoint(index, value);
    },
    [debouncedUpdateMainPoint],
  );

  return (
    <section className="mb-8">
      <SectionHeading
        title={heading}
        className="text-xl font-semibold text-gray-900"
      >
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={addTextNextStep}>
            <Plus className="h-4 w-4 mr-1" /> {addTextBtnText}
          </Button>
          <Button variant="outline" size="sm" onClick={addPointsNextStep}>
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
                  onChange={(newValue) => updateNextStep(index, newValue)}
                  minHeight="100px"
                  placeholder={placeholderTextContent}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteNextStep(index)}
                  className="text-gray-500 hover:text-red-600  opacity-35 hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2 w-full">
                  <EditableSubheading
                    value={step.main}
                    placeholder={placeholderHeading}
                    className="flex-1 p-2 border rounded text-lg font-semibold min-w-[500px]"
                    onChange={(newHeading) => {
                      handleMainPointChange(index, newHeading);
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteNextStep(index)}
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
                          updateSubPointNextStep(index, pointIndex, newValue)
                        }
                        minHeight="60px"
                        placeholder={placeholderPoint}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          deleteSubPointNextStep(index, pointIndex)
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
                    onClick={() => addSubPointNextStep(index)}
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
