"use client";
import { JSX, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { AiCompetencies } from "./ai-competencies/AiCompetencies";
import ActionsBar from "./action-bar/ActionsBar";
import { SortedEvidence } from "@/lib/api";
import { useAnalysisStore } from "@/zustand/store/analysisStore";
import { useUserPreferencesStore } from "@/zustand/store/userPreferencesStore";
import {
  parseHierarchicalPath,
  SelectPathIds,
} from "@/lib/types/types.user-preferences";
import { templatesIds } from "@/lib/types/types.analysis";
import { ManualReport } from "./manual-report/ManualReport";
import { FullReport } from "./full-report/FullReport";
import { TabsComponent } from "./Tabs";

export function AnalysisDisplay() {
  const loading = useAnalysisStore((state) => state.loading);
  const templates = useAnalysisStore((state) => state.templates);
  const [initializing, setInitializing] = useState(false);

  // Check if templates are initialized
  useEffect(() => {
    // If templates object is empty or missing required templates, show initializing state
    const hasRequiredTemplates =
      templates &&
      Object.keys(templates).length >= 3 &&
      templates[templatesIds.base] &&
      templates[templatesIds.fullReport] &&
      templates[templatesIds.aiCompetencies];

    setInitializing(!hasRequiredTemplates);
  }, [templates]);
  const selectedPath = useUserPreferencesStore((state) => state.selectedPath);
  const getChildTabs = useUserPreferencesStore((state) => state.getChildTabs);
  const availablePaths = useUserPreferencesStore(
    (state) => state.availablePaths,
  );

  const [currentTab, setCurrentTab] = useState<SelectPathIds>();
  const [haveSubTab, setHaveSubTab] = useState(false);

  useEffect(() => {
    const tab = parseHierarchicalPath(selectedPath).parentId;
    setCurrentTab(tab);
    setHaveSubTab(getChildTabs(tab).length > 0);
  }, [getChildTabs, selectedPath]);

  const tabComponentsMap: Record<SelectPathIds, JSX.ElementType> = {
    "manual-report": ManualReport,
    "ai-agent-full-report": FullReport,
    "ai-competencies": AiCompetencies,
  };

  const renderTabComponent = (tabPathId: SelectPathIds, key: string) => {
    const TabComponent = tabComponentsMap[tabPathId];

    if (!TabComponent) {
      return (
        <TabsContent value={tabPathId} key={key}>
          Invalid Tab
        </TabsContent>
      );
    }

    return (
      <TabsContent value={tabPathId} key={key}>
        <TabComponent />
      </TabsContent>
    );
  };

  if (loading || initializing) {
    return (
      <>
        <div className="grid place-items-center w-full h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg font-medium text-gray-700">
              {initializing
                ? "Initializing report templates..."
                : "Loading analysis data..."}
            </p>
            <p className="text-sm text-gray-500 max-w-md text-center">
              {initializing
                ? "Creating empty templates for this task. This will only take a moment."
                : "Please wait while we load your analysis data."}
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="flex">
      {/* Main Content */}
      <div className="flex-1">
        <Tabs value={currentTab}>
          <div
            className={cn(
              "pt-3 ",
              "bg-background",
              !haveSubTab && "pb-3 shadow",
              "flex flex-col gap-6 justify-between ",
            )}
          >
            <ActionsBar />
            <div className="text-xs flex gap-2">
              <div className="flex flex-col gap-2">
                <p className="border-l-4 border-green-500 px-2 bg-green-50">
                  Green text represents
                </p>
                <p className="border-l-4 border-red-500 px-2 bg-red-50">
                  Red text represents
                </p>
              </div>
            </div>
            <div className={cn("flex items-center justify-between ")}>
              <TabsComponent />
            </div>
          </div>
          {availablePaths.map((path) => {
            return renderTabComponent(path.id, path.id);
          })}
        </Tabs>
      </div>
    </div>
  );
}
