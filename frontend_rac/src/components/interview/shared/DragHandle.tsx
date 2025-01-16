import { GripVertical } from 'lucide-react';

export function DragHandle() {
  return (
    <div className="p-2 rounded hover:bg-gray-100 cursor-grab active:cursor-grabbing">
      <GripVertical className="h-4 w-4 text-gray-400" />
    </div>
  );
}