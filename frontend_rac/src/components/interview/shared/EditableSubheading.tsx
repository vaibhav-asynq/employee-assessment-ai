// src/components/interview/shared/EditableSubheading.tsx
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface EditableSubheadingProps {
  value: string;
  onChange: (newValue: string) => void;
  onDelete?: () => void;
}

export function EditableSubheading({
  value,
  onChange,
  onDelete
}: EditableSubheadingProps) {
  // Handle input changes normally without drag interference
  return (
    <div className="flex items-center gap-2 mb-2">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="font-medium"
      />
      {onDelete && (
        <Button variant="ghost" size="icon" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}