import React from 'react';

interface EditableTextProps {
  value: string;
  onChange: (value: string) => void;
  minHeight?: string;
  placeholder?: string;
}

export function EditableText({ 
  value, 
  onChange, 
  minHeight = "100px",
  placeholder = "Enter text..."
}: EditableTextProps) {
  return (
    <textarea
      className="w-full p-2 border rounded-md"
      style={{ minHeight }}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}
