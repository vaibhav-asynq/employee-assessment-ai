import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  sanitizeInput,
  containsHTML,
  containsCode,
  hasSuspiciousContent,
} from "@/lib/sanitize";
import { useDebounce } from "@/lib/utils/debounce";
import { cn } from "@/lib/utils";

interface EditableSubheadingProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  classNameContainer?: string;
}

export function EditableSubheading({
  value,
  onChange,
  placeholder = "Enter subheading...",
  className = "",
  classNameContainer = "",
}: EditableSubheadingProps) {
  const inputRef = useRef<HTMLInputElement>(null);
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

  // Handle local changes without updating parent
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const newValue = e.target.value;
    setLocalValue(newValue);

    // Check for various suspicious content
    setHasHTML(containsHTML(newValue));
    setHasCode(containsCode(newValue));
    setHasSuspicious(hasSuspiciousContent(newValue));
  }, []);

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
    if (inputRef.current) {
      const length = inputRef.current.value.length;
      inputRef.current.setSelectionRange(length, length);
    }
  }, []);

  // Handle blur - update parent state
  const handleBlur = useCallback(() => {
    setIsEditing(false);
    if (localValue !== value) {
      const sanitizedValue = sanitizeInput(localValue);
      onChange(sanitizedValue);

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
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (inputRef.current) {
          inputRef.current.blur();
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
    <div className={cn("flex flex-col group", classNameContainer)}>
      <input
        ref={inputRef}
        type="text"
        className={cn(
          `flex-1 text-lg font-semibold p-2 border rounded focus:outline-none focus:ring-1`,
          className,
          `${
            hasHTML || hasCode || hasSuspicious
              ? "border-red-500 focus:ring-red-500"
              : "focus:ring-blue-500"
          }`,
        )}
        value={localValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
      />

      {(hasHTML || hasCode || hasSuspicious) && (
        <div className="text-red-500 text-xs mt-1">
          this heading is not allowed! Please change it.
        </div>
      )}
    </div>
  );
}
