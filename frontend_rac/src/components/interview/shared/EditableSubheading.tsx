import React from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface EditableSubheadingProps {
  value: string;
  onChange: (value: string) => void;
  onDelete: () => void;
}

export function EditableSubheading({ value, onChange, onDelete }: EditableSubheadingProps) {
  return (
    <div className="flex items-center justify-between mb-2">
      <input
        type="text"
        className="flex-1 text-lg font-semibold p-2 border rounded mr-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter subheading..."
      />
      <Button
        variant="ghost"
        size="icon"
        onClick={onDelete}
        className="text-gray-500 hover:text-red-600"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
