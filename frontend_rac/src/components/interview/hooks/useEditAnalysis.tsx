import { NextStep, NextStepPoint } from "@/lib/types";
import { TemplatedData } from "@/lib/types/types.analysis";
import { useCallback } from "react";
import { v4 as uuidv4 } from "uuid";

type UpdateFunction = (updater: (prev: TemplatedData) => TemplatedData) => void;

export function useEditAnalysis(handleAnalysisUpdate: UpdateFunction) {
  // Strengths
  const handleAddStrength = useCallback(
    (heading = "New Strength", addCounter: boolean = true) => {
      handleAnalysisUpdate((prev) => {
        const id = uuidv4(); // Generate a unique ID
        const newHeading = `${heading} ${addCounter ? Object.keys(prev.strengths.items).length + 1 : ""}`;
        return {
          ...prev,
          strengths: {
            order: [id, ...prev.strengths.order],
            items: {
              ...prev.strengths.items,
              [id]: { id, heading: newHeading, content: "", evidence: [] },
            },
          },
        };
      });
    },
    [handleAnalysisUpdate],
  );

  const handleStrengthHeadingChange = useCallback(
    (id: string, newHeading: string) => {
      handleAnalysisUpdate((prev) => {
        const strength = prev.strengths.items[id];
        if (!strength) return prev;

        return {
          ...prev,
          strengths: {
            ...prev.strengths,
            items: {
              ...prev.strengths.items,
              [id]: { ...strength, heading: newHeading },
            },
          },
        };
      });
    },
    [handleAnalysisUpdate],
  );

  const handleStrengthDelete = useCallback(
    (id: string) => {
      handleAnalysisUpdate((prev) => {
        const { [id]: _, ...rest } = prev.strengths.items;
        return {
          ...prev,
          strengths: {
            order: prev.strengths.order.filter((itemId) => itemId !== id),
            items: rest,
          },
        };
      });
    },
    [handleAnalysisUpdate],
  );

  const handleStrengthContentChange = useCallback(
    (id: string, newContent: string) => {
      handleAnalysisUpdate((prev) => {
        const strength = prev.strengths.items[id];
        if (!strength) return prev;

        return {
          ...prev,
          strengths: {
            ...prev.strengths,
            items: {
              ...prev.strengths.items,
              [id]: { ...strength, content: newContent },
            },
          },
        };
      });
    },
    [handleAnalysisUpdate],
  );

  // Areas to Target
  const handleAddArea = useCallback(
    (heading = "New Area", addCounter: boolean = true) => {
      handleAnalysisUpdate((prev) => {
        const id = uuidv4(); // Generate a unique ID
        const newHeading = `${heading} ${addCounter ? Object.keys(prev.areas_to_target.items).length + 1 : ""}`;
        return {
          ...prev,
          areas_to_target: {
            order: [id, ...prev.areas_to_target.order],
            items: {
              ...prev.areas_to_target.items,
              [id]: {
                id,
                heading: newHeading,
                content: "",
                evidence: [],
                competencyAlignment: [],
              },
            },
          },
        };
      });
    },
    [handleAnalysisUpdate],
  );

  const handleAreaHeadingChange = useCallback(
    (id: string, newHeading: string) => {
      handleAnalysisUpdate((prev) => {
        const area = prev.areas_to_target.items[id];
        if (!area) return prev;

        return {
          ...prev,
          areas_to_target: {
            ...prev.areas_to_target,
            items: {
              ...prev.areas_to_target.items,
              [id]: { ...area, heading: newHeading },
            },
          },
        };
      });
    },
    [handleAnalysisUpdate],
  );

  const handleAreaDelete = useCallback(
    (id: string) => {
      handleAnalysisUpdate((prev) => {
        const { [id]: _, ...rest } = prev.areas_to_target.items;
        return {
          ...prev,
          areas_to_target: {
            order: prev.areas_to_target.order.filter((itemId) => itemId !== id),
            items: rest,
          },
        };
      });
    },
    [handleAnalysisUpdate],
  );

  const handleAreaContentChange = useCallback(
    (id: string, newContent: string) => {
      handleAnalysisUpdate((prev) => {
        const area = prev.areas_to_target.items[id];
        if (!area) return prev;

        return {
          ...prev,
          areas_to_target: {
            ...prev.areas_to_target,
            items: {
              ...prev.areas_to_target.items,
              [id]: { ...area, content: newContent },
            },
          },
        };
      });
    },
    [handleAnalysisUpdate],
  );

  // Next Step (unchanged)
  const handleAddTextNextStep = useCallback(() => {
    handleAnalysisUpdate((prev) => ({
      ...prev,
      next_steps: [...prev.next_steps, ""],
    }));
  }, [handleAnalysisUpdate]);

  const handleAddPointsNextStep = useCallback(() => {
    handleAnalysisUpdate((prev) => ({
      ...prev,
      next_steps: [...prev.next_steps, { main: "", sub_points: [""] }],
    }));
  }, [handleAnalysisUpdate]);

  const handleUpdateNextStep = useCallback(
    (index: number, newValue: NextStep) => {
      handleAnalysisUpdate((prev) => {
        const newSteps = [...prev.next_steps];
        newSteps[index] = newValue;
        return {
          ...prev,
          next_steps: newSteps,
        };
      });
    },
    [handleAnalysisUpdate],
  );

  const handleDeleteNextStep = useCallback(
    (index: number) => {
      handleAnalysisUpdate((prev) => ({
        ...prev,
        next_steps: prev.next_steps.filter((_, i) => i !== index),
      }));
    },
    [handleAnalysisUpdate],
  );

  const handleUpdateMainPointNextStep = useCallback(
    (index: number, newMain: string) => {
      handleAnalysisUpdate((prev) => {
        const step = prev.next_steps[index] as NextStepPoint;
        const newSteps = [...prev.next_steps];
        newSteps[index] = {
          ...step,
          main: newMain,
        };
        return {
          ...prev,
          next_steps: newSteps,
        };
      });
    },
    [handleAnalysisUpdate],
  );

  const handleUpdateSubPointNextStep = useCallback(
    (stepIndex: number, pointIndex: number, newValue: string) => {
      handleAnalysisUpdate((prev) => {
        const step = prev.next_steps[stepIndex] as NextStepPoint;
        const newSubPoints = [...step.sub_points];
        newSubPoints[pointIndex] = newValue;
        const newSteps = [...prev.next_steps];
        newSteps[stepIndex] = {
          ...step,
          sub_points: newSubPoints,
        };
        return {
          ...prev,
          next_steps: newSteps,
        };
      });
    },
    [handleAnalysisUpdate],
  );

  const handleDeleteSubPointNextStep = useCallback(
    (stepIndex: number, pointIndex: number) => {
      handleAnalysisUpdate((prev) => {
        const step = prev.next_steps[stepIndex] as NextStepPoint;
        const newSteps = [...prev.next_steps];
        newSteps[stepIndex] = {
          ...step,
          sub_points: step.sub_points.filter((_, i) => i !== pointIndex),
        };
        return {
          ...prev,
          next_steps: newSteps,
        };
      });
    },
    [handleAnalysisUpdate],
  );

  const handleAddSubPointNextStep = useCallback(
    (stepIndex: number) => {
      handleAnalysisUpdate((prev) => {
        const step = prev.next_steps[stepIndex] as NextStepPoint;
        const newSteps = [...prev.next_steps];
        newSteps[stepIndex] = {
          ...step,
          sub_points: [...step.sub_points, ""],
        };
        return {
          ...prev,
          next_steps: newSteps,
        };
      });
    },
    [handleAnalysisUpdate],
  );

  return {
    // Strengths
    handleAddStrength,
    handleStrengthHeadingChange,
    handleStrengthDelete,
    handleStrengthContentChange,

    // Areas to Target
    handleAddArea,
    handleAreaHeadingChange,
    handleAreaDelete,
    handleAreaContentChange,

    // Next Steps
    handleAddTextNextStep,
    handleAddPointsNextStep,
    handleUpdateNextStep,
    handleDeleteNextStep,
    handleUpdateMainPointNextStep,
    handleUpdateSubPointNextStep,
    handleDeleteSubPointNextStep,
    handleAddSubPointNextStep,
  };
}
