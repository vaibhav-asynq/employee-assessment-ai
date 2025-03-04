"use client";
import { JSX, useEffect, useState } from "react";
import { sortAreasEvidence, sortStrengthsEvidence } from "@/lib/api";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  ChildPath,
  ChildPathIds,
  parseHierarchicalPath,
  SelectPathIds,
} from "@/lib/types/types.user-preferences";
import { useUserPreferencesStore } from "@/zustand/store/userPreferencesStore";
import { useAnalysisStore } from "@/zustand/store/analysisStore";
import { templatesIds } from "@/lib/types";
import { useInterviewDataStore } from "@/zustand/store/interviewDataStore";
import { SubTabs } from "../SubTabs";
import { FullReportView } from "./FullReportView";
import { SortedReport } from "./SortedReport";
import type { SortedEvidence } from "@/lib/api";
import { Sortings } from "./Sortings";

export function FullReport() {
  const parentTabId: SelectPathIds = "ai-agent-full-report";
  const selectedPath = useUserPreferencesStore((state) => state.selectedPath);
  const getChildTabs = useUserPreferencesStore((state) => state.getChildTabs);
  const setSelectedPath = useUserPreferencesStore((state) => state.setSelectedPath);
  const fileId = useInterviewDataStore((state) => state.fileId);
  const templates = useAnalysisStore((state) => state.templates);
  const setAutoSortInProgress = useAnalysisStore((state) => state.setAutoSortInProgress);

  //TODO: implement better sort
  const [sortedStrengths, setSortedStrengths] = useState<
    SortedEvidence[] | undefined
  >();
  const [sortedAreas, setSortedAreas] = useState<
    SortedEvidence[] | undefined
  >();

  const [currentTab, setCurrentTab] = useState<ChildPathIds>();
  const [availableTabs, setAvailableTabs] = useState<ChildPath[]>([]);
  
  // Add effect to check for auto-sort flag
  useEffect(() => {
    // Check if the flag is set
    const shouldAutoSort = localStorage.getItem('autoSortFullReport') === 'true';
    
    if (shouldAutoSort) {
      // Clear the flag
      localStorage.removeItem('autoSortFullReport');
      
      // Set auto-sort in progress
      setAutoSortInProgress(true);
      
      // Wait for data to load
      setTimeout(async () => {
        try {
          // Get the template data
          const analysisWithAiCoach = templates[templatesIds.fullReport];
          if (!fileId || !analysisWithAiCoach) return;
          
          // Get headings for sorting
          const strengthsHeadings = analysisWithAiCoach.strengths.order.map(
            (id) => analysisWithAiCoach.strengths.items[id].heading
          );
          
          const areasHeadings = analysisWithAiCoach.areas_to_target.order.map(
            (id) => analysisWithAiCoach.areas_to_target.items[id].heading
          );
          
          // Sort the evidence
          const [strengthsData, areasData] = await Promise.all([
            sortStrengthsEvidence(fileId, strengthsHeadings),
            sortAreasEvidence(fileId, areasHeadings)
          ]);
          
          // Update state
          setSortedStrengths(strengthsData);
          setSortedAreas(areasData);
          
          // Navigate to the sorted-evidence tab
          setSelectedPath(parentTabId, "sorted-evidence");
        } catch (error) {
          console.error("Error auto-sorting evidence:", error);
        } finally {
          // Clear auto-sort in progress
          setAutoSortInProgress(false);
        }
      }, 1000); // 1 second delay to ensure data is loaded
    }
  }, [fileId, templates, setSortedStrengths, setSortedAreas, parentTabId, setSelectedPath, setAutoSortInProgress]);


  const tabComponentsMap: Record<ChildPathIds, JSX.ElementType> = {
    "interview-feedback": FullReportView,
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
          <div>
            <div className="mb-2">
              <Sortings
                parentTabId="ai-agent-full-report"
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
