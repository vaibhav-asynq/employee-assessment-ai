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
  }),
);
