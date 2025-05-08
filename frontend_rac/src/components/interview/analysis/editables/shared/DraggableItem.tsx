import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

interface DraggableItemProps {
  id: string;
  children: React.ReactNode;
}

export function DraggableItem({ id, children }: DraggableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: "relative" as const,
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <div ref={setNodeRef} style={style} className="mb-6 group">
      <div className="flex items-start">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab mt-2 p-2 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <GripVertical className="h-5 w-5" />
        </div>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}

