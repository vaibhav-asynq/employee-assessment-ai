import { useCallback, useRef } from "react";
import { useAnalysisStore } from "@/zustand/store/analysisStore";
import { useSnapshotSaver } from "./useSnapshotSaver";
import { useDebounce } from "@/lib/utils/debounce";
import { TemplatedData, TemplateId } from "@/lib/types/types.analysis";
import { v4 as uuidv4 } from "uuid";

/**
 * A hook that provides methods to update template data with debounced snapshot saving
 */
export function useTemplateUpdater() {
  const handleAnalysisUpdate = useAnalysisStore(
    (state) => state.handleAnalysisUpdate,
  );
  const { saveSnapshotToDb } = useSnapshotSaver();
  const pendingUpdatesRef = useRef<boolean>(false);

  // Debounced function to save snapshot
  const debouncedSaveSnapshot = useDebounce(
    () => {
      if (pendingUpdatesRef.current) {
        saveSnapshotToDb("auto", true);
        pendingUpdatesRef.current = false;
      }
    },
    2000,
    [saveSnapshotToDb],
  );

  // Generic update function that handles any template update
  const updateTemplate = useCallback(
    (updater: (prev: TemplatedData) => TemplatedData) => {
      handleAnalysisUpdate(updater);
      pendingUpdatesRef.current = true;
      debouncedSaveSnapshot();
    },
    [handleAnalysisUpdate, debouncedSaveSnapshot],
  );

  // Force save snapshot immediately
  const forceSaveSnapshot = useCallback(() => {
    if (pendingUpdatesRef.current) {
      saveSnapshotToDb("manual", true);
      pendingUpdatesRef.current = false;
    }
  }, [saveSnapshotToDb]);

  // Strengths related methods
  const addStrength = useCallback(
    (heading = "New Strength", addCounter: boolean = true) => {
      updateTemplate((prev) => {
        const id = uuidv4();
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
    [updateTemplate],
  );

  const updateStrengthHeading = useCallback(
    (id: string, newHeading: string) => {
      updateTemplate((prev) => {
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
    [updateTemplate],
  );

  const deleteStrength = useCallback(
    (id: string) => {
      updateTemplate((prev) => {
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
    [updateTemplate],
  );

  const updateStrengthContent = useCallback(
    (id: string, newContent: string) => {
      updateTemplate((prev) => {
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
    [updateTemplate],
  );

  // Areas to Target related methods
  const addArea = useCallback(
    (heading = "New Area", addCounter: boolean = true) => {
      updateTemplate((prev) => {
        const id = uuidv4();
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
    [updateTemplate],
  );

  const updateAreaHeading = useCallback(
    (id: string, newHeading: string) => {
      updateTemplate((prev) => {
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
    [updateTemplate],
  );

  const deleteArea = useCallback(
    (id: string) => {
      updateTemplate((prev) => {
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
    [updateTemplate],
  );

  const updateAreaContent = useCallback(
    (id: string, newContent: string) => {
      updateTemplate((prev) => {
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
    [updateTemplate],
  );

  // Next Steps related methods
  const addTextNextStep = useCallback(() => {
    updateTemplate((prev) => ({
      ...prev,
      next_steps: [...prev.next_steps, ""],
    }));
  }, [updateTemplate]);

  const addPointsNextStep = useCallback(() => {
    updateTemplate((prev) => ({
      ...prev,
      next_steps: [...prev.next_steps, { main: "", sub_points: [""] }],
    }));
  }, [updateTemplate]);

  const updateNextStep = useCallback(
    (index: number, newValue: any) => {
      updateTemplate((prev) => {
        const newSteps = [...prev.next_steps];
        newSteps[index] = newValue;
        return {
          ...prev,
          next_steps: newSteps,
        };
      });
    },
    [updateTemplate],
  );

  const deleteNextStep = useCallback(
    (index: number) => {
      updateTemplate((prev) => ({
        ...prev,
        next_steps: prev.next_steps.filter((_, i) => i !== index),
      }));
    },
    [updateTemplate],
  );

  const updateMainPointNextStep = useCallback(
    (index: number, newMain: string) => {
      updateTemplate((prev) => {
        const step = prev.next_steps[index] as any;
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
    [updateTemplate],
  );

  const updateSubPointNextStep = useCallback(
    (stepIndex: number, pointIndex: number, newValue: string) => {
      updateTemplate((prev) => {
        const step = prev.next_steps[stepIndex] as any;
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
    [updateTemplate],
  );

  const deleteSubPointNextStep = useCallback(
    (stepIndex: number, pointIndex: number) => {
      updateTemplate((prev) => {
        const step = prev.next_steps[stepIndex] as any;
        const newSteps = [...prev.next_steps];
        newSteps[stepIndex] = {
          ...step,
          sub_points: step.sub_points.filter(
            (_: any, i: number) => i !== pointIndex,
          ),
        };
        return {
          ...prev,
          next_steps: newSteps,
        };
      });
    },
    [updateTemplate],
  );

  const addSubPointNextStep = useCallback(
    (stepIndex: number) => {
      updateTemplate((prev) => {
        const step = prev.next_steps[stepIndex] as any;
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
    [updateTemplate],
  );

  return {
    // Core methods
    updateTemplate,
    forceSaveSnapshot,

    // Strengths
    addStrength,
    updateStrengthHeading,
    deleteStrength,
    updateStrengthContent,

    // Areas
    addArea,
    updateAreaHeading,
    deleteArea,
    updateAreaContent,

    // Next Steps
    addTextNextStep,
    addPointsNextStep,
    updateNextStep,
    deleteNextStep,
    updateMainPointNextStep,
    updateSubPointNextStep,
    deleteSubPointNextStep,
    addSubPointNextStep,
  };
}
