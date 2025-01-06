// src/components/interview/shared/EditableSubheading.tsx
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface EditableSubheadingProps {
  value: string;
  onChange: (newValue: string) => void;
  onDelete: () => void;
  className?: string;
}

export function EditableSubheading({ 
  value, 
  onChange, 
  onDelete,
  className = '' 
}: EditableSubheadingProps) {
  return (
    <div className="flex items-center gap-2">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`text-sm font-bold text-gray-700 ${className}`}
        placeholder="Enter subheading"
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