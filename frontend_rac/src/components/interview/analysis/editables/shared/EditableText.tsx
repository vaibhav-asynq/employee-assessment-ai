import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  sanitizeInput,
  containsHTML,
  containsCode,
  hasSuspiciousContent,
} from "@/lib/sanitize";
import { useDebounce } from "@/lib/utils/debounce";

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
  placeholder = "Enter text...",
}: EditableTextProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [localValue, setLocalValue] = useState(value);
  const [isEditing, setIsEditing] = useState(false);
  const [hasHTML, setHasHTML] = useState(false);
  const [hasCode, setHasCode] = useState(false);
  const [hasSuspicious, setHasSuspicious] = useState(false);

  // Sync with parent value when not editing
  useEffect(() => {
    if (!isEditing) {
      setLocalValue(value);
    }
  }, [value, isEditing]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = minHeight;
      const scrollHeight = textarea.scrollHeight;
      textarea.style.height = scrollHeight + "px";
    }
  }, [localValue, minHeight]);

  // Handle local changes without updating parent
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      e.preventDefault();
      const newValue = e.target.value;
      setLocalValue(newValue);

      // Check for various suspicious content
      setHasHTML(containsHTML(newValue));
      setHasCode(containsCode(newValue));
      setHasSuspicious(hasSuspiciousContent(newValue));
    },
    [],
  );

  // Debounced onChange handler
  const debouncedOnChange = useDebounce(
    (value: string) => {
      const sanitizedValue = sanitizeInput(value);
      onChange(sanitizedValue);
    },
    300,
    [onChange],
  );

  // Handle focus
  const handleFocus = useCallback(() => {
    setIsEditing(true);
    if (textareaRef.current) {
      const length = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(length, length);
    }
  }, []);

  // Handle blur - update parent state
  const handleBlur = useCallback(() => {
    setIsEditing(false);
    if (localValue !== value) {
      const sanitizedValue = sanitizeInput(localValue);
      onChange(sanitizedValue);

      // Reset the content if any suspicious content was detected
      if (hasHTML || hasCode || hasSuspicious) {
        setLocalValue(sanitizedValue);
        setHasHTML(false);
        setHasCode(false);
        setHasSuspicious(false);
      }
    }
  }, [localValue, value, onChange, hasHTML, hasCode, hasSuspicious]);

  // Handle keyboard events
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && e.metaKey) {
        e.preventDefault();
        if (textareaRef.current) {
          textareaRef.current.blur();
        }
      } else {
        // For other key events, update via debounced handler while typing
        if (localValue !== value && !hasHTML && !hasCode && !hasSuspicious) {
          debouncedOnChange(localValue);
        }
      }
    },
    [localValue, value, debouncedOnChange, hasHTML, hasCode, hasSuspicious],
  );

  return (
    <div className="w-full flex flex-col group">
      <textarea
        ref={textareaRef}
        className={`w-full p-2 border rounded resize-none focus:outline-none focus:ring-1 ${
          hasHTML || hasCode || hasSuspicious
            ? "border-red-500 focus:ring-red-500"
            : "focus:ring-blue-500"
        }`}
        style={{ minHeight }}
        value={localValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
      />
      {(hasHTML || hasCode || hasSuspicious) && (
        <div className="text-red-500 text-xs mt-1">
          this text is not allowed! Please change it.
        </div>
      )}
    </div>
  );
}
