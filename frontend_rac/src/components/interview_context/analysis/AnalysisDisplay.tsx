"use client";
import { useInterviewAnalysis } from "@/components/providers/InterviewAnalysisContext";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sortings } from "./Sortings";
import { cn } from "@/lib/utils";
import { AiCompetencies } from "./ai-competencies/AiCompetencies";
import { templatesIds } from "@/lib/types";
import { BaseEdit } from "./base-edit/BaseEdit";
import ActionsBar from "./action-bar/ActionsBar";
import { SortedEvidences } from "./sorted-evidence/SortedEvidence";
import { SortedEvidence } from "@/lib/api";

export function AnalysisDisplay() {
  const { loading, setActiveTemplate, selectedPath, setSelectedPath } =
    useInterviewAnalysis();

  const [sortedStrengths, setSortedStrengths] = useState<SortedEvidence[]>([]);
  const [sortedAreas, setSortedAreas] = useState<SortedEvidence[]>([]);


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
        {/* INFO: selectedPath is being used as Tabs */}
        <Tabs value={selectedPath}>
          {/* header */}
          <div
            className={cn(
              "sticky top-0",
              "py-2 pb-4",
              "bg-background shadow",
              "flex flex-col gap-6 justify-between ",
            )}
          >
            <ActionsBar />
            <div className={cn("flex items-center justify-between ")}>
              <div className="flex items-center">
                <TabsList>
                  <TabsTrigger
                    value="base-edit"
                    onClick={() => {
                      setActiveTemplate(templatesIds.coachParagraph);
                      setSelectedPath("base-edit");
                    }}
                  >
                    Interview Feedback
                  </TabsTrigger>
                  <TabsTrigger
                    value="sorted-evidence"
                    onClick={() => setSelectedPath("sorted-evidence")}
                    disabled={!sortedStrengths.length && !sortedAreas.length}
                  >
                    Sorted Evidence
                  </TabsTrigger>

                  <TabsTrigger
                    value="ai-competencies"
                    onClick={() => setSelectedPath("ai-competencies")}
                    // disabled={}
                  >
                    AI-Generated competencies
                  </TabsTrigger>
                </TabsList>
              </div>

                {/* <Sortings */}
                {/*   setSortedAreas={setSortedAreas} */}
                {/*   setSortedStrengths={setSortedStrengths} */}
                {/* /> */}
              {["sorted", "edit"].includes(selectedPath) && (
                <Sortings
                  setSortedAreas={setSortedAreas}
                  setSortedStrengths={setSortedStrengths}
                />
              )}
            </div>
          </div>

          <TabsContent value="base-edit">
            <BaseEdit />
          </TabsContent>

          <TabsContent value="sorted-evidence">
            <SortedEvidences
              sortedStrengthEvidences={sortedStrengths}
              sortedAreasEvidences={sortedAreas}
            />
          </TabsContent>

          <TabsContent value="ai-competencies">
            <AiCompetencies />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
