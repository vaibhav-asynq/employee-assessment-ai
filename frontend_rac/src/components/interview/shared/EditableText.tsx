// src/components/interview/shared/EditableText.tsx
import { Textarea } from '@/components/ui/textarea';

interface EditableTextProps {
  value: string;
  onChange: (newValue: string) => void;
  className?: string;
  minHeight?: string;
  onDragStart?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  draggable?: boolean;
}

export function EditableText({ 
  value, 
  onChange, 
  className = '', 
  minHeight = '100px',
  onDragStart,
  onDrop,
  draggable = true
}: EditableTextProps) {
  return (
    <Textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`${className} ${draggable ? 'cursor-move' : ''}`}
      style={{ minHeight }}
      placeholder="Enter text"
      draggable={draggable}
      onDragStart={onDragStart}
      onDrop={onDrop}
      onDragOver={(e) => e.preventDefault()}
    />
  );
}