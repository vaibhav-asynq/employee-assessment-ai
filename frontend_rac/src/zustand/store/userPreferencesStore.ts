import { create } from "zustand";
import {
  AvailablePaths,
  ChildPath,
  ChildPathIds,
  createHierarchicalPath,
  HierarchicalPath,
  parseHierarchicalPath,
  SelectPathIds,
} from "@/lib/types/types.user-preferences";
import { ANALYSIS_TAB_NAMES } from "@/lib/constants";

type UserPreferencesState = {
  loading: boolean;
  error: string;
  selectedPath: SelectPathIds | HierarchicalPath;
  availablePaths: AvailablePaths;

  setSelectedPath: (parentId: SelectPathIds, childId?: ChildPathIds) => void;
  getChildTabs: (parentId: SelectPathIds) => ChildPath[];
  addPath: (id: SelectPathIds, name: string) => void; // Add a new parent tab
  addChildTab: (
    parentId: SelectPathIds,
    id: ChildPathIds,
    name: string,
  ) => void; // Add a new child tab
  deletePath: (id: SelectPathIds) => void; // Delete a parent tab and all its children
  deleteChildTab: (parentId: SelectPathIds, childId: ChildPathIds) => void; // Delete a specific child tab
};

const child_feedback: ChildPath[] = [
  {
    name: ANALYSIS_TAB_NAMES.interviewFeedback,
    id: "interview-feedback",
  },
];
const startingTabs: AvailablePaths = [
  {
    name: ANALYSIS_TAB_NAMES.manualReport,
    id: "manual-report",
    child: child_feedback,
  },
];

export const useUserPreferencesStore = create<UserPreferencesState>(
  (set, get) => ({
    // initial States
    loading: false,
    error: "",
    selectedPath: `manual-report.interview-feedback`,
    availablePaths: startingTabs,

    setSelectedPath: (parentId: SelectPathIds, childId?: ChildPathIds) => {
      const { availablePaths } = get();

      try {
        const path = createHierarchicalPath(parentId, childId);
        const { parentId: parsedParentId, childId: parsedChildId } =
          parseHierarchicalPath(path);
        const parentTab = availablePaths.find(
          (tab) => tab.id === parsedParentId,
        );
        if (!parentTab) {
          throw new Error(`Parent tab with ID "${parsedParentId}" not found.`);
        }
        if (parsedChildId) {
          const childTab = parentTab.child?.find(
            (child) => child.id === parsedChildId,
          );
          if (!childTab) {
            throw new Error(
              `Child tab with ID "${parsedChildId}" not found in parent "${parsedParentId}".`,
            );
          }
          set({ selectedPath: path });
          return;
        }
        set({ selectedPath: path });
      } catch (error) {
        set({
          error:
            error instanceof Error
              ? error.message
              : "An unknown error occurred.",
        });
      }
    },

    getChildTabs: (parentId: SelectPathIds): ChildPath[] => {
      const { availablePaths } = get();
      const parentTab = availablePaths.find((tab) => tab.id === parentId);
      if (!parentTab) {
        set({
          error: `Parent tab with ID "${parentId}" not found.`,
        });
        return [];
      }
      return parentTab.child || [];
    },

    addPath: (id: SelectPathIds, name: string) => {
      const { availablePaths } = get();
      const existingTab = availablePaths.find((tab) => tab.id === id);
      if (existingTab) {
        console.warn(`Tab with ID "${id}" already exists. Skipping addition.`);
        return;
      }
      set({
        availablePaths: [
          ...availablePaths,
          {
            id,
            name,
            child: [],
          },
        ],
      });
    },

    addChildTab: (parentId: SelectPathIds, id: ChildPathIds, name: string) => {
      const { availablePaths } = get();
      const parentTab = availablePaths.find((tab) => tab.id === parentId);
      if (!parentTab) {
        console.warn(`Parent tab with ID "${parentId}" not found.`);
        return;
      }
      const existingChild = parentTab.child?.find((child) => child.id === id);
      if (existingChild) {
        console.warn(
          `Child tab with ID "${id}" already exists in parent "${parentId}". Skipping addition.`,
        );
        return;
      }
      set({
        availablePaths: availablePaths.map((tab) =>
          tab.id === parentId
            ? {
                ...tab,
                child: [...(tab.child || []), { id, name }],
              }
            : tab,
        ),
      });
    },

    deletePath: (id: SelectPathIds) => {
      const { availablePaths, selectedPath } = get();

      // Check if the path exists
      const pathExists = availablePaths.some((tab) => tab.id === id);
      if (!pathExists) {
        console.warn(`Path with ID "${id}" not found. Nothing to delete.`);
        return;
      }

      // Filter out the path to be deleted
      const updatedPaths = availablePaths.filter((tab) => tab.id !== id);

      // If there are no paths left, show an error
      if (updatedPaths.length === 0) {
        console.error("Cannot delete the last remaining path.");
        set({ error: "Cannot delete the last remaining path." });
        return;
      }

      // Update selected path if the deleted path was selected
      let updatedSelectedPath = selectedPath;
      const { parentId } = parseHierarchicalPath(selectedPath);

      if (parentId === id) {
        // If the deleted path was selected, select the first available path
        const firstPath = updatedPaths[0];
        const firstChildId =
          firstPath.child && firstPath.child.length > 0
            ? firstPath.child[0].id
            : undefined;

        updatedSelectedPath = createHierarchicalPath(
          firstPath.id,
          firstChildId,
        );
      }

      set({
        availablePaths: updatedPaths,
        selectedPath: updatedSelectedPath,
      });
    },

    deleteChildTab: (parentId: SelectPathIds, childId: ChildPathIds) => {
      const { availablePaths, selectedPath } = get();

      // Find the parent tab
      const parentTab = availablePaths.find((tab) => tab.id === parentId);
      if (!parentTab) {
        console.warn(`Parent tab with ID "${parentId}" not found.`);
        return;
      }

      // Check if the child tab exists
      const childExists = parentTab.child?.some(
        (child) => child.id === childId,
      );
      if (!childExists) {
        console.warn(
          `Child tab with ID "${childId}" not found in parent "${parentId}".`,
        );
        return;
      }

      // Check if this is the last child tab
      if (parentTab.child?.length === 1) {
        console.warn(
          `Cannot delete the last child tab from parent "${parentId}".`,
        );
        set({
          error: `Cannot delete the last child tab from parent "${parentId}".`,
        });
        return;
      }

      // Filter out the child tab to be deleted
      const updatedPaths = availablePaths.map((tab) => {
        if (tab.id === parentId) {
          return {
            ...tab,
            child: tab.child?.filter((child) => child.id !== childId) || [],
          };
        }
        return tab;
      });

      // Update selected path if the deleted child tab was selected
      let updatedSelectedPath = selectedPath;
      const { parentId: selectedParentId, childId: selectedChildId } =
        parseHierarchicalPath(selectedPath);

      if (selectedParentId === parentId && selectedChildId === childId) {
        // If the deleted child tab was selected, select the first available child tab
        const updatedParentTab = updatedPaths.find(
          (tab) => tab.id === parentId,
        );
        if (
          updatedParentTab &&
          updatedParentTab.child &&
          updatedParentTab.child.length > 0
        ) {
          updatedSelectedPath = createHierarchicalPath(
            parentId,
            updatedParentTab.child[0].id,
          );
        } else {
          updatedSelectedPath = parentId;
        }
      }

      set({
        availablePaths: updatedPaths,
        selectedPath: updatedSelectedPath,
      });
    },
  }),
);
