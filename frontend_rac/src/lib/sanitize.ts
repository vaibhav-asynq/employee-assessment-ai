import DOMPurify from "dompurify";
import React from "react";

/**
 * Sanitizes input text to prevent XSS attacks
 * @param value - The input value to sanitize
 * @returns Sanitized string
 */
export const sanitizeInput = (value: string): string => {
  return DOMPurify.sanitize(value, { ALLOWED_TAGS: [] });
};

/**
 * Checks if a string contains programming code patterns
 * @param value - The input value to check
 * @returns Boolean indicating if the string contains code
 */
export const containsCode = (value: string): boolean => {
  // Check for common programming patterns
  const codePatterns = [
    // JavaScript/TypeScript patterns
    /function\s*\(/i,
    /const\s+\w+\s*=/i,
    /let\s+\w+\s*=/i,
    /var\s+\w+\s*=/i,
    /=>\s*{/i,
    /import\s+.*\s+from/i,
    /export\s+(default\s+)?(function|class|const)/i,
    /new\s+[A-Z]\w+\(/i,
    /\.\s*then\s*\(/i,
    /\.\s*catch\s*\(/i,
    /async\s+function/i,
    /await\s+\w+/i,

    // Python patterns
    /def\s+\w+\s*\(/i,
    /class\s+\w+\s*:/i,
    /import\s+\w+/i,
    /from\s+\w+\s+import/i,
    /try\s*:\s*\n/i,
    /except\s+/i,

    // SQL patterns
    /SELECT\s+.*\s+FROM/i,
    /INSERT\s+INTO/i,
    /UPDATE\s+.*\s+SET/i,
    /DELETE\s+FROM/i,
    /CREATE\s+TABLE/i,
    /ALTER\s+TABLE/i,
    /DROP\s+TABLE/i,

    // Common code structures
    /for\s*\(\s*\w+/i,
    /while\s*\(\s*\w+/i,
    /if\s*\(\s*\w+/i,
    /if\s+\w+\s*:/i, // Python if
    /switch\s*\(\s*\w+/i,
    /case\s+['"]?\w+['"]?:/i,

    // Brackets and indentation patterns that might indicate code blocks
    /{\s*\n.*\n.*}/s,
    /\[\s*\n.*\n.*\]/s,
    /\(\s*\n.*\n.*\)/s,
    /^\s{4,}.*\n\s{4,}/m, // Consistent indentation

    // Shell/bash patterns
    /\$\(\s*.*\s*\)/i,
    /`.*`/i, // Backtick command execution
    /sudo\s+/i,
    /chmod\s+/i,
    /chown\s+/i,
    /rm\s+-rf/i,
  ];

  return codePatterns.some((pattern) => pattern.test(value));
};

/**
 * Checks if a string contains HTML or script tags
 * @param value - The input value to check
 * @returns Boolean indicating if the string contains HTML
 */
export const containsHTML = (value: string): boolean => {
  // Check for common HTML tags and entities
  const htmlRegex = /<[^>]*>|&[a-z]+;/i;

  // Check for script tags and other dangerous HTML
  const dangerousPatterns = [
    /<script/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /javascript:/i,
    /data:/i,
    /on\w+=/i, // onclick, onload, etc.
  ];
  return (
    htmlRegex.test(value) ||
    dangerousPatterns.some((pattern) => pattern.test(value))
  );
};

/**
 * Checks for other suspicious content patterns
 * @param value - The input value to check
 * @returns Boolean indicating if the string contains suspicious content
 */
export const hasSuspiciousContent = (value: string): boolean => {
  // Check for potentially malicious patterns
  const suspiciousPatterns = [
    // URL shorteners that might hide malicious links
    /bit\.ly/i,
    /tinyurl\.com/i,
    /goo\.gl/i,
    /t\.co/i,
    /is\.gd/i,

    // Potentially malicious file extensions in URLs
    /\.(exe|bat|cmd|sh|dll|vbs|js|jar|msi)(\?|\s|$)/i,

    // IP addresses (might indicate phishing attempts)
    /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/i,

    // Base64 encoded content (might hide malicious code)
    /[a-zA-Z0-9+/]{50,}={0,2}/i,

    // Excessive use of Unicode or special characters
    /[\u0080-\uFFFF]{10,}/,

    // Potential credit card numbers
    /\b(?:\d{4}[-\s]?){3}\d{4}\b/,

    // Potential Social Security Numbers
    /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/,
  ];

  return suspiciousPatterns.some((pattern) => pattern.test(value));
};

/**
 * Custom hook for handling sanitized input
 * @param initialValue - Initial input value
 * @param onSanitizedChange - Callback for when sanitized value changes
 * @returns Object with value, onChange handler, and validation state
 */
export const useSanitizedInput = (
  initialValue: string,
  onSanitizedChange: (value: string) => void,
) => {
  const [value, setValue] = React.useState(initialValue);
  const [hasHTML, setHasHTML] = React.useState(false);
  const [hasCode, setHasCode] = React.useState(false);

  React.useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const newValue = e.target.value;
    setValue(newValue);

    // Check if input contains suspicious content
    const containsHtml = containsHTML(newValue);
    const containsCodePattern = containsCode(newValue);
    const containsSuspicious = hasSuspiciousContent(newValue);

    setHasHTML(containsHtml);
    setHasCode(containsCodePattern);

    // Determine if there's any suspicious content
    const isSuspicious =
      containsHtml || containsCodePattern || containsSuspicious;

    // Only update with sanitized value if it doesn't contain suspicious content
    if (!isSuspicious) {
      onSanitizedChange(sanitizeInput(newValue));
    }
  };

  return {
    value,
    onChange,
    hasHTML,
    hasCode,
    hasSuspiciousContent: hasHTML || hasCode || hasSuspiciousContent(value),
    sanitizedValue: sanitizeInput(value),
    isSafe: !hasHTML && !hasCode && !hasSuspiciousContent(value),
  };
};
