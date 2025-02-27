"use client";
import { JSX, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Sortings } from "./Sortings";
import { cn } from "@/lib/utils";
import { AiCompetencies } from "./ai-competencies/AiCompetencies";
import { BaseEdit } from "./base-edit/BaseEdit";
import ActionsBar from "./action-bar/ActionsBar";
import { SortedEvidence } from "@/lib/api";
import { useAnalysisStore } from "@/zustand/store/analysisStore";
import { useUserPreferencesStore } from "@/zustand/store/userPreferencesStore";
import {
  parseHierarchicalPath,
  SelectPathIds,
} from "@/lib/types/types.user-preferences";
import { ManualReport } from "./manual-report/ManualReport";
import { FullReport } from "./full-report/FullReport";
import { TabsComponent } from "./Tabs";

export function AnalysisDisplay() {
  const loading = useAnalysisStore((state) => state.loading);
  const selectedPath = useUserPreferencesStore((state) => state.selectedPath);
  const getChildTabs = useUserPreferencesStore((state) => state.getChildTabs);
  const availablePaths = useUserPreferencesStore(
    (state) => state.availablePaths,
  );

  const [sortedStrengths, setSortedStrengths] = useState<SortedEvidence[]>([]);
  const [sortedAreas, setSortedAreas] = useState<SortedEvidence[]>([]);
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

  if (loading) {
    return (
      <>
        <div className="grid place-items-center animate-spin w-full">
          <Loader2 />
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
