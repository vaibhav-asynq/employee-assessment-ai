"use client";
import { JSX, useEffect, useState } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  ChildPath,
  ChildPathIds,
  parseHierarchicalPath,
  SelectPathIds,
} from "@/lib/types/types.user-preferences";
import { useUserPreferencesStore } from "@/zustand/store/userPreferencesStore";
import { cn } from "@/lib/utils";
import { SubTabs } from "../SubTabs";
import { ManualReportView } from "./ManualReportView";
import { SortedReport } from "./SortedReport";
import { SortedEvidence } from "@/lib/api";
import { Sortings } from "./Sortings";

export function ManualReport() {
  const parentTabId: SelectPathIds = "manual-report";
  const selectedPath = useUserPreferencesStore((state) => state.selectedPath);
  const getChildTabs = useUserPreferencesStore((state) => state.getChildTabs);

  const [currentTab, setCurrentTab] = useState<ChildPathIds>();
  const [availableTabs, setAvailableTabs] = useState<ChildPath[]>([]);

  //TODO: implement better sort
  const [sortedStrengths, setSortedStrengths] = useState<
    SortedEvidence[] | undefined
  >();
  const [sortedAreas, setSortedAreas] = useState<
    SortedEvidence[] | undefined
  >();

  const tabComponentsMap: Record<ChildPathIds, JSX.ElementType> = {
    "interview-feedback": ManualReportView,
    "sorted-evidence": SortedReport,
  };

  const renderTabComponent = (tabPathId: ChildPathIds, key: string) => {
    const TabComponent = tabComponentsMap[tabPathId];

    if (!TabComponent) {
      return (
        <TabsContent value={tabPathId} key={key}>
          Invalid Tab
        </TabsContent>
      );
    }
    if (tabPathId === "sorted-evidence") {
      return (
        <TabsContent value={tabPathId} key={key}>
          <SortedReport
            sortedAreas={sortedAreas}
            sortedStrengths={sortedStrengths}
          />
        </TabsContent>
      );
    }

    return (
      <TabsContent value={tabPathId} key={key}>
        <TabComponent />
      </TabsContent>
    );
  };

  useEffect(() => {
    //TODO: handle tab selection gracefully
    const tab =
      parseHierarchicalPath(selectedPath).childId || "interview-feedback";
    setCurrentTab(tab);

    setAvailableTabs(getChildTabs(parentTabId));
  }, [getChildTabs, selectedPath]);

  return (
    <div className="flex">
      <div className="pb3 flex-1">
        <Tabs value={currentTab}>
          <div className="sticky top-[110px] bg-background shadow pt-2 flex items-center justify-between z-10">
            <SubTabs parentTabId={parentTabId} />
            <div>
              <Sortings
                parentTabId="manual-report"
                setSortedAreas={setSortedAreas}
                setSortedStrengths={setSortedStrengths}
              />
            </div>
          </div>
          {availableTabs.map((path) => {
            return renderTabComponent(path.id, path.id);
          })}
        </Tabs>
      </div>
    </div>
  );
}
