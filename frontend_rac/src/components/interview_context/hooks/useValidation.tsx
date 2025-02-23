import { useCallback } from "react";
import { OrderedInterviewAnalysis } from "@/lib/types";

type ValidationRule = {
  defaultPattern?: RegExp; // Regex pattern to detect default headings
};

// Default validation rules
const DEFAULT_VALIDATION_RULES: Record<string, ValidationRule> = {
  strengths: {
    defaultPattern: /^Strength \d+$/,
  },
  areas_to_target: {
    defaultPattern: /^Development Area \d+$/,
  },
};

// TODO: add type safety AND null safety
export function useValidation(
  analysisData: OrderedInterviewAnalysis,
  customValidationRules?: Partial<Record<string, ValidationRule>>,
) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const validationRules = {
    ...DEFAULT_VALIDATION_RULES,
    ...customValidationRules, // Override defaults with custom rules if provided
  };

  // Validate a specific section
  const validateSection = useCallback(
    (sectionType: string): boolean => {
      const rules = validationRules[sectionType];
      if (!rules) return true; // No rules defined for this section

      const section = analysisData[sectionType];
      if (!section) return false; // Section doesn't exist in the data

      return Object.values(section.items).every((item) => {
        // INFO: here applying validation
        // Check if heading is empty or just whitespace
        if (!item.heading || item.heading.trim() === "") {
          return false;
        }

        // Check if heading matches the default pattern
        if (rules.defaultPattern && rules.defaultPattern.test(item.heading)) {
          return false;
        }

        return true;
      });
    },
    [analysisData, validationRules],
  );

  // Validate all sections
  const validateAll = useCallback(() => {
    return Object.keys(validationRules).every((sectionType) =>
      validateSection(sectionType),
    );
  }, [validationRules, validateSection]);

  return {
    validateSection,
    validateAll,
  };
}
