import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { Strengths, TemplateId } from "@/lib/types/types.analysis";
import { useAnalysisStore } from "@/zustand/store/analysisStore";
import { useEditAnalysis } from "../../hooks/useEditAnalysis";
import { GenerateStrengthsAi } from "./GenerateStrengthsAi";
import { EditableSubheading } from "./shared/EditableSubheading";
import { SectionHeading } from "./shared/SectionHeading";
import { EditableText } from "./shared/EditableText";

interface EditableStrengthsProps {
  strengths: Strengths;
  templateId: TemplateId;
  aiPrompt?: boolean;
  heading?: string;
  placeholderSubheading?: string;
  placeholderContent?: string;
  addBtnText?: string;
  promptBtnText?: string;
}
export function EditStrengths({
  strengths,
  templateId,
  aiPrompt = true,
  heading = "STRENGTHS",
  placeholderSubheading = "Enter Subheading...",
  placeholderContent = "Enter text...",
  addBtnText = "Add Subheading",
  promptBtnText = "Prompt with AI",
}: EditableStrengthsProps) {
  const handleAnalysisUpdate = useAnalysisStore(
    (state) => state.handleAnalysisUpdate,
  );
  const {
    handleAddStrength,
    handleStrengthDelete,
    handleStrengthContentChange,
    handleStrengthHeadingChange,
  } = useEditAnalysis(handleAnalysisUpdate);

  return (
    <section className="mb-8">
      <SectionHeading
        title={heading}
        className="text-xl font-semibold text-gray-900"
      >
        <Button variant="outline" size="sm" onClick={() => handleAddStrength()}>
          <Plus className="h-4 w-4 mr-1" /> {addBtnText}
        </Button>
      </SectionHeading>
      <div className="flex flex-col gap-6">
        {strengths.order.map((id) => {
          const item = strengths.items[id];
          return (
            <div key={id} className="">
              <div className="flex items-center gap-x-2 mb-2">
                <div className="flex-1">
                  <EditableSubheading
                    value={item.heading.trim()}
                    placeholder={placeholderSubheading}
                    onChange={(newHeading) => {
                      handleStrengthHeadingChange(id, newHeading);
                    }}
                  />
                </div>
                {aiPrompt && (
                  <GenerateStrengthsAi
                    btnText={promptBtnText}
                    templateId={templateId}
                    strenghtItemId={id}
                  />
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    handleStrengthDelete(id);
                  }}
                  className="text-gray-500 hover:text-red-600 opacity-35 hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <EditableText
                value={item.content}
                onChange={(newContent) => {
                  handleStrengthContentChange(id, newContent);
                }}
                minHeight="180px"
                placeholder={placeholderContent}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
