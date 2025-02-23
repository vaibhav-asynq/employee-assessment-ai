// INFO: mention expected Ids
export type ChildPathIds = "interview-feedback" | "sorted-evidence";
export type ChildPath = {
  name: string;
  id: ChildPathIds;
};

// INFO: mention expected Ids
export type SelectPathIds =
  | "manual-report"
  | "ai-agent-full-report"
  | "ai-competencies";
export interface SelectPath {
  name: string;
  id: SelectPathIds;
  child?: ChildPath[];
}

export type AvailablePaths = SelectPath[];
export type HierarchicalPath = `${string}.${string}`; // Format: "parentId.childId"

export const createHierarchicalPath = (
  parentId: SelectPathIds,
  childId?: ChildPathIds,
): SelectPathIds | HierarchicalPath => {
  if (childId) {
    return `${parentId}.${childId}`;
  }
  return parentId;
};

export const parseHierarchicalPath = (
  path: SelectPathIds | HierarchicalPath,
): { parentId: SelectPathIds; childId?: ChildPathIds } => {
  if (path.includes(".")) {
    const [parentId, childId] = path.split(".") as [
      SelectPathIds,
      ChildPathIds,
    ];
    return { parentId, childId };
  }
  return { parentId: path as SelectPathIds };
};
