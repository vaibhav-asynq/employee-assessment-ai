import { NextStep, NextStepPoint, OrderedInterviewAnalysis } from "@/lib/types";
import { useCallback } from "react";

type UpdateFunction = (
  updater: (prev: OrderedInterviewAnalysis) => OrderedInterviewAnalysis,
) => void;

export function useEditAnalysis(handleAnalysisUpdate: UpdateFunction) {
  // Strengths
  const handleAddStrength = useCallback(
    (heading = "New Strength", addCounter: boolean = true) => {
      handleAnalysisUpdate((prev) => {
        const newHeading = `${heading} ${addCounter ? Object.keys(prev.strengths.items).length + 1 : ""}`;
        return {
          ...prev,
          strengths: {
            order: [newHeading, ...prev.strengths.order],
            items: {
              ...prev.strengths.items,
              [newHeading]: "",
            },
          },
        };
      });
    },
    [handleAnalysisUpdate],
  );
  const handleStrengthHeadingChange = useCallback(
    (oldHeading: string, newHeading: string) => {
      handleAnalysisUpdate((prev) => {
        const { [oldHeading]: oldContent, ...rest } = prev.strengths.items;
        return {
          ...prev,
          strengths: {
            order: prev.strengths.order.map((h) =>
              h === oldHeading ? newHeading : h,
            ),
            items: {
              ...rest,
              [newHeading]: oldContent,
            },
          },
        };
      });
    },
    [handleAnalysisUpdate],
  );
  const handleStrengthDelete = useCallback(
    (heading: string) => {
      handleAnalysisUpdate((prev) => {
        const { [heading]: _, ...rest } = prev.strengths.items;
        return {
          ...prev,
          strengths: {
            order: prev.strengths.order.filter((h) => h !== heading),
            items: rest,
          },
        };
      });
    },
    [handleAnalysisUpdate],
  );
  const handleStrengthContentChange = useCallback(
    (heading: string, newContent: string) => {
      handleAnalysisUpdate((prev) => ({
        ...prev,
        strengths: {
          order: prev.strengths.order,
          items: {
            ...prev.strengths.items,
            [heading]: newContent,
          },
        },
      }));
    },
    [handleAnalysisUpdate],
  );

  // areas to target
  const handleAddArea = useCallback(
    (heading = "New Strength", addCounter: boolean = true) => {
      handleAnalysisUpdate((prev) => {
        const newHeading = `${heading} ${addCounter ? Object.keys(prev.areas_to_target.items).length + 1 : ""}`;
        return {
          ...prev,
          areas_to_target: {
            order: [newHeading, ...prev.areas_to_target.order], // Add to beginning
            items: {
              ...prev.areas_to_target.items,
              [newHeading]: "",
            },
          },
        };
      });
    },
    [handleAnalysisUpdate],
  );
  const handleAreaHeadingChange = useCallback(
    (oldHeading: string, newHeading: string) => {
      handleAnalysisUpdate((prev) => {
        const { [oldHeading]: oldContent, ...rest } =
          prev.areas_to_target.items;
        return {
          ...prev,
          areas_to_target: {
            order: prev.areas_to_target.order.map((h) =>
              h === oldHeading ? newHeading : h,
            ),
            items: {
              ...rest,
              [newHeading]: oldContent,
            },
          },
        };
      });
    },
    [handleAnalysisUpdate],
  );
  const handleAreaDelete = useCallback(
    (heading: string) => {
      handleAnalysisUpdate((prev) => {
        const { [heading]: _, ...rest } = prev.areas_to_target.items;
        return {
          ...prev,
          areas_to_target: {
            order: prev.areas_to_target.order.filter((h) => h !== heading),
            items: rest,
          },
        };
      });
    },
    [handleAnalysisUpdate],
  );
  const handleAreaContentChange = useCallback(
    (heading: string, newContent: string) => {
      handleAnalysisUpdate((prev) => ({
        ...prev,
        areas_to_target: {
          order: prev.areas_to_target.order,
          items: {
            ...prev.areas_to_target.items,
            [heading]: newContent,
          },
        },
      }));
    },
    [handleAnalysisUpdate],
  );

  // Next Step
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
    // strength
    handleAddStrength,
    handleStrengthHeadingChange,
    handleStrengthDelete,
    handleStrengthContentChange,

    // areas to target
    handleAddArea,
    handleAreaHeadingChange,
    handleAreaDelete,
    handleAreaContentChange,

    // Next Step
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
