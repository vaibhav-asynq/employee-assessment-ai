import { create } from "zustand";
import { TemplateId, templatesIds } from "@/lib/types";

import { base } from "@/lib/analysis/templates";
import { TemplatedData } from "@/lib/types/types.analysis";
import { convertInterviewAnalysisDataToTemplatedData } from "@/lib/utils/analysisUtils";

type AnalysisState = {
  loading: boolean;
  error: string;
  templates: Record<TemplateId, TemplatedData>;
  activeTemplateId: TemplateId | null;
  originalTemplates: Record<TemplateId, TemplatedData>;
  pendingChanges: Partial<TemplatedData>;
  isEditing: boolean;

  setActiveTemplate: (id: TemplateId) => void;
  addTemplate: (
    id: TemplateId,
    template: TemplatedData,
    activateTemplate?: boolean,
  ) => void;
  removeTemplate: (id: TemplateId) => void;
  handleAnalysisUpdate: (
    updater: (prev: TemplatedData) => TemplatedData,
  ) => void;
  resetAnalysisToOriginal: () => void;
  saveChanges: () => Promise<void>;
  discardChanges: () => void;
};

export const useAnalysisStore = create<AnalysisState>((set, get) => ({
  // initial States
  loading: false,
  error: "",
  templates: {
    [templatesIds.base]: convertInterviewAnalysisDataToTemplatedData(base),
  },
  activeTemplateId: null,
  originalTemplates: {
    [templatesIds.base]: convertInterviewAnalysisDataToTemplatedData(base),
  },
  pendingChanges: {},
  isEditing: false,

  setActiveTemplate: (id) => {
    const { templates } = get();
    if (templates[id]) {
      set({ activeTemplateId: id });
    } else {
      set({ error: `Template with ID ${id} not found` });
    }
  },

  addTemplate: (id, template, activateTemplate = false) => {
    const { templates, originalTemplates, setActiveTemplate } = get();
    if (templates[id] || originalTemplates[id]) {
      console.warn(`Template with ID ${id} already exists. Skipping addition.`);
      return;
    }
    set({
      templates: {
        ...templates,
        [id]: template,
      },
      originalTemplates: {
        ...originalTemplates,
        [id]: template,
      },
    });
    if (activateTemplate) {
      setActiveTemplate(id);
    }
  },
  removeTemplate: (id) => {
    const { templates, activeTemplateId } = get();
    const { [id]: _, ...restTemplates } = templates;
    set({
      templates: restTemplates,
      activeTemplateId:
        activeTemplateId === id
          ? (Object.keys(restTemplates)[0] as TemplateId) || null
          : activeTemplateId,
    });
  },

  handleAnalysisUpdate: (updater) => {
    const { activeTemplateId, templates } = get();
    if (!activeTemplateId) return;
    const updatedTemplates = {
      ...templates,
      [activeTemplateId]: updater(templates[activeTemplateId]),
    };
    set({ templates: updatedTemplates, isEditing: true });
  },

  resetAnalysisToOriginal: () => {
    const { activeTemplateId, originalTemplates, templates } = get();
    if (!activeTemplateId) return;
    const original = originalTemplates[activeTemplateId];
    set({
      templates: {
        ...templates,
        [activeTemplateId]: original,
      },
      isEditing: false,
      error: "",
    });
  },

  saveChanges: async () => {
    const { activeTemplateId, templates } = get();
    if (!activeTemplateId) return;
    set({
      loading: true,
      error: "",
    });
    try {
      const currentTemplate = templates[activeTemplateId];
      if (!currentTemplate) throw new Error("No active template found");
      // Simulate API call to save changes
      console.log("Saving changes...", currentTemplate);
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to save changes",
      });
    } finally {
      set({
        loading: false,
      });
    }
  },

  discardChanges: () => {
    set({ pendingChanges: {}, isEditing: false });
  },
}));
