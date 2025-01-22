import { Textarea } from '@/components/ui/textarea';

interface EditableTextProps {
  value: string;
  onChange: (newValue: string) => void;
  className?: string;
  minHeight?: string;
}

export function EditableText({ 
  value, 
  onChange, 
  className = '', 
  minHeight = '100px' 
}: EditableTextProps) {
  return (
    <Textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`${className}`}
      style={{ minHeight }}
      placeholder="Enter text"
    />
  );
}