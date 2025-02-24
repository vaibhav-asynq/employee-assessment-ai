import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { AreasToTarget, TemplateId } from "@/lib/types/types.analysis";
import { useAnalysisStore } from "@/zustand/store/analysisStore";
import { useEditAnalysis } from "../../hooks/useEditAnalysis";
import { EditableSubheading } from "./shared/EditableSubheading";
import { SectionHeading } from "./shared/SectionHeading";
import { EditableText } from "./shared/EditableText";
import { GenerateAreasAi } from "./GenerateAreasAi";

interface EditAreasProps {
  areas: AreasToTarget;
  templateId: TemplateId;
  aiPropmt?: boolean;
  heading?: string;
  placeholderSubheading?: string;
  placeholderContent?: string;
  addBtnText?: string;
  propmtBtnText?: string;
}
export function EditAreas({
  areas,
  templateId,
  aiPropmt = true,
  heading = "AREAS TO TARGET",
  placeholderSubheading = "Enter Subheading...",
  placeholderContent = "Enter text...",
  addBtnText = "Add Subheading",
  propmtBtnText = "Prompt with AI",
}: EditAreasProps) {
  const handleAnalysisUpdate = useAnalysisStore(
    (state) => state.handleAnalysisUpdate,
  );
  const {
    handleAddArea,
    handleAreaHeadingChange,
    handleAreaDelete,
    handleAreaContentChange,
  } = useEditAnalysis(handleAnalysisUpdate);

  return (
    <section className="mb-8">
      <SectionHeading
        title={heading}
        className="text-xl font-semibold text-gray-900"
      >
        <Button variant="outline" size="sm" onClick={() => handleAddArea()}>
          <Plus className="h-4 w-4 mr-1" /> {addBtnText}
        </Button>
      </SectionHeading>
      <div className="flex flex-col gap-6">
        {areas.order.map((id) => {
          const item = areas.items[id];
          return (
            <div key={id} className="">
              <div className="flex items-center gap-x-2 mb-2">
                <div className="flex-1">
                  <EditableSubheading
                    value={item.heading.trim()}
                    placeholder={placeholderSubheading}
                    onChange={(newHeading) => {
                      handleAreaHeadingChange(id, newHeading);
                    }}
                  />
                </div>
                {aiPropmt && (
                  <GenerateAreasAi
                    btnText={propmtBtnText}
                    templateId={templateId}
                    strenghtItemId={id}
                  />
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    handleAreaDelete(id);
                  }}
                  className="text-gray-500 hover:text-red-600 opacity-35 hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <EditableText
                value={item.content}
                onChange={(newContent) => {
                  handleAreaContentChange(id, newContent);
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
