// src/components/interview/shared/DraggableSection.tsx
import React from 'react';
import { DragHandle } from './DragHandle';

interface DraggableSectionProps {
  children: React.ReactNode;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  className?: string;
}

export function DraggableSection({
  children,
  onDragStart,
  onDragOver,
  onDrop,
  className = ''
}: DraggableSectionProps) {
  return (
    <div
      className={`group relative border border-transparent hover:border-gray-200 hover:bg-gray-50 rounded-lg p-4 transition-colors ${className}`}
    >
      <div 
        className="absolute left-[-24px] top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
        onDragStart={onDragStart}
        draggable
      >
        <DragHandle />
      </div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (onDragOver) onDragOver(e);
        }}
        onDrop={(e) => {
          e.preventDefault();
          if (onDrop) onDrop(e);
        }}
      >
        {children}
      </div>
    </div>
  );
}