"use client";
import { useInterviewAnalysis } from "@/components/providers/InterviewAnalysisContext";
import { useState } from "react";
import { SortedEvidence } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EditableTemplateAnalysis } from "./EditableTemplateAnalysis";
import { Sortings } from "./Sortings";
import { SortedEvidenceView } from "./SortedEvidenceView";
import { cn } from "@/lib/utils";
import OtherActionsBar from "./OtherActionsBar";
import { AiCompetencies } from "../ai-competencies/AiCompetencies";
import { templatesIds } from "@/lib/types";

export type Tab = "edit" | "sorted" | "ai-competencies";

export function AiPargraph() {
  const {
    loading,
    setActiveTemplate,
    selectedPath,
    setSelectedPath,
  } = useInterviewAnalysis();

  const [sortedStrengths, setSortedStrengths] = useState<
    SortedEvidence[] | undefined
  >();
  const [sortedAreas, setSortedAreas] = useState<
    SortedEvidence[] | undefined
  >();

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
            <OtherActionsBar />
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
                    Sorted by stakeholder
                  </TabsTrigger>
                  <TabsTrigger
                    value="sorted-evidence"
                    onClick={() => setSelectedPath("sorted-evidence")}
                    disabled={!sortedStrengths && !sortedAreas}
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

              {["sorted", "edit"].includes(selectedPath) && (
                <Sortings
                  setSortedAreas={setSortedAreas}
                  setSortedStrengths={setSortedStrengths}
                />
              )}
            </div>
          </div>

          <TabsContent value="edit">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <div className="mt-4 mb-6">
                  <h2 className="text-2xl font-bold">Sorted by stakeholder</h2>
                </div>
                {/* //here was feedback display */}
              </div>
              <div className="border-l pl-8">
                <EditableTemplateAnalysis />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="sorted">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold">Sorted Evidence</h2>
                </div>
                <SortedEvidenceView
                  strengthsEvidence={sortedStrengths}
                  areasEvidence={sortedAreas}
                />
              </div>
              <div className="border-l pl-8">
                <EditableTemplateAnalysis />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="ai-competencies">
            <div>
              <AiCompetencies />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
