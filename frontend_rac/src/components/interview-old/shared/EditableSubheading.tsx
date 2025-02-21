import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface EditableSubheadingProps {
  value: string;
  onChange: (value: string) => void;
  onDelete: () => void;
}

export function EditableSubheading({ value, onChange, onDelete }: EditableSubheadingProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localValue, setLocalValue] = useState(value);
  const [isEditing, setIsEditing] = useState(false);

  // Sync with parent value when not editing
  useEffect(() => {
    if (!isEditing) {
      setLocalValue(value);
    }
  }, [value, isEditing]);

  // Handle local changes without updating parent
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    setLocalValue(e.target.value);
  }, []);

  // Handle focus
  const handleFocus = useCallback(() => {
    setIsEditing(true);
    if (inputRef.current) {
      const length = inputRef.current.value.length;
      inputRef.current.setSelectionRange(length, length);
    }
  }, []);

  // Handle blur - update parent state
  const handleBlur = useCallback(() => {
    setIsEditing(false);
    if (localValue !== value) {
      onChange(localValue);
    }
  }, [localValue, value, onChange]);

  // Handle keyboard events
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (inputRef.current) {
        inputRef.current.blur();
      }
    }
  }, []);

  return (
    <div className="flex items-center justify-between mb-2 group">
      <input
        ref={inputRef}
        type="text"
        className="flex-1 text-lg font-semibold p-2 border rounded mr-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={localValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder="Enter subheading..."
      />
      <Button
        variant="ghost"
        size="icon"
        onClick={onDelete}
        className="text-gray-500 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
