import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { Strengths, TemplateId } from "@/lib/types/types.analysis";
import { GenerateStrengthsAi } from "./GenerateStrengthsAi";
import { EditableSubheading } from "./shared/EditableSubheading";
import { SectionHeading } from "./shared/SectionHeading";
import { EditableText } from "./shared/EditableText";
import { useTemplateUpdater } from "@/hooks/useTemplateUpdater";
import { DraggableItem } from "./shared/DraggableItem";
import { useCallback, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  restrictToVerticalAxis,
  restrictToWindowEdges,
} from "@dnd-kit/modifiers";

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
  const {
    addStrength,
    deleteStrength,
    updateStrengthContent,
    updateStrengthHeading,
    updateTemplate,
  } = useTemplateUpdater();

  const [isDragging, setIsDragging] = useState(false);

  // Configure sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Handle drag end event
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setIsDragging(false);

      if (over && active.id !== over.id) {
        // Update the order in the store
        updateTemplate((prev) => {
          const oldIndex = prev.strengths.order.indexOf(active.id as string);
          const newIndex = prev.strengths.order.indexOf(over.id as string);

          return {
            ...prev,
            strengths: {
              ...prev.strengths,
              order: arrayMove(prev.strengths.order, oldIndex, newIndex),
            },
          };
        });
      }
    },
    [updateTemplate],
  );

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  return (
    <section className="mb-8">
      <SectionHeading
        title={heading}
        className="text-xl font-semibold text-gray-900"
      >
        <Button variant="outline" size="sm" onClick={() => addStrength()}>
          <Plus className="h-4 w-4 mr-1" /> {addBtnText}
        </Button>
      </SectionHeading>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        onDragStart={handleDragStart}
        modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
      >
        <SortableContext
          items={strengths.order}
          strategy={verticalListSortingStrategy}
        >
          <div
            className={`flex flex-col ${isDragging ? "cursor-grabbing" : ""}`}
          >
            {strengths.order.map((id) => {
              const item = strengths.items[id];
              return (
                <DraggableItem key={id} id={id}>
                  <div className="flex items-center gap-x-2 mb-2">
                    <div className="flex-1">
                      <EditableSubheading
                        value={item.heading.trim()}
                        placeholder={placeholderSubheading}
                        onChange={(newHeading) => {
                          updateStrengthHeading(id, newHeading);
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
                        deleteStrength(id);
                      }}
                      className="text-gray-500 hover:text-red-600 opacity-35 hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <EditableText
                    value={item.content}
                    onChange={(newContent) => {
                      updateStrengthContent(id, newContent);
                    }}
                    minHeight="180px"
                    placeholder={placeholderContent}
                  />
                </DraggableItem>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>
    </section>
  );
}
