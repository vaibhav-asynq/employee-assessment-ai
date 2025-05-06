"use client";
import { JSX, useCallback, useEffect, useState } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  ChildPath,
  ChildPathIds,
  parseHierarchicalPath,
  SelectPathIds,
} from "@/lib/types/types.user-preferences";
import { useUserPreferencesStore } from "@/zustand/store/userPreferencesStore";
import { SubTabs } from "../SubTabs";
import { ManualReportView } from "./ManualReportView";
import { SortedReport } from "./SortedReport";
import { SortedEvidence } from "@/lib/api";
import { Sortings } from "./Sortings";
import { useSnapshotSaver } from "@/hooks/useSnapshotSaver";
import { useInterviewDataStore } from "@/zustand/store/interviewDataStore";

export function ManualReport() {
  const parentTabId: SelectPathIds = "manual-report";
  const { selectedPath, getChildTabs } = useUserPreferencesStore();
  const { updateManualReportSortedCompetency, manualReport } =
    useInterviewDataStore();
  const { saveSnapshotToDb } = useSnapshotSaver();

  const [currentTab, setCurrentTab] = useState<ChildPathIds>();
  const [availableTabs, setAvailableTabs] = useState<ChildPath[]>([]);

  const setSortedAreas = useCallback(
    (value: SortedEvidence[]) => {
      updateManualReportSortedCompetency({ sorted_areas: value });
      saveSnapshotToDb("auto", true);
    },
    [saveSnapshotToDb, updateManualReportSortedCompetency],
  );
  const setSortedStrengths = useCallback(
    (value: SortedEvidence[]) => {
      updateManualReportSortedCompetency({ sorted_strength: value });
      saveSnapshotToDb("auto", true);
    },
    [saveSnapshotToDb, updateManualReportSortedCompetency],
  );

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
            sortedAreas={manualReport.sorted_by_competency?.sorted_areas}
            sortedStrengths={manualReport.sorted_by_competency?.sorted_strength}
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
          <div>
            <div className="mb-2">
              <Sortings
                parentTabId="manual-report"
                setSortedAreas={setSortedAreas}
                setSortedStrengths={setSortedStrengths}
              />
            </div>
            <div className="bg-background shadow pt-2">
              <SubTabs parentTabId={parentTabId} />
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
