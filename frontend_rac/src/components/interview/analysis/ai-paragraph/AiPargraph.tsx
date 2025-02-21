"use client";
import { useInterviewAnalysis } from "@/components/providers/InterviewAnalysisContext";
import { FeedbackDisplay } from "../FeedbackDisplay";
import { useState } from "react";
import { SortedEvidence } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EditableTemplateAnalysis } from "./EditableTemplateAnalysis";
import { Sortings } from "./Sortings";
import { SortedEvidenceView } from "./SortedEvidenceView";
import { cn } from "@/lib/utils";

export type Tab = "edit" | "sorted";

export function AiPargraph() {
  const { loading, feedbackData } = useInterviewAnalysis();
  const [activeTab, setActiveTab] = useState<Tab>("edit");

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
        <Tabs value={activeTab}>
          <div
            className={cn(
              "sticky top-0",
              "py-2 pb-4",
              "bg-background shadow",
              "flex items-center justify-between ",
            )}
          >
            <div className="flex items-center">
              <TabsList>
                <TabsTrigger value="edit" onClick={() => setActiveTab("edit")}>
                Interview Feedback
                </TabsTrigger>
                <TabsTrigger
                  value="sorted"
                  onClick={() => setActiveTab("sorted")}
                  disabled={!sortedStrengths && !sortedAreas}
                >
                  Sorted Evidence
                </TabsTrigger>
              </TabsList>
            </div>

            <Sortings
              setSortedAreas={setSortedAreas}
              setSortedStrengths={setSortedStrengths}
              setActiveTab={setActiveTab}
            />
          </div>

          <TabsContent value="edit">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <div className="mt-4 mb-6">
                  <h2 className="text-2xl font-bold">Interview Feedback</h2>
                </div>
                {loading ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">Loading feedback data...</p>
                  </div>
                ) : feedbackData ? (
                  <FeedbackDisplay data={feedbackData} />
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600">No feedback data available</p>
                  </div>
                )}
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
        </Tabs>
      </div>
    </div>
  );
}
