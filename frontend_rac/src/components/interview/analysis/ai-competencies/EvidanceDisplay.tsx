import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { templatesIds } from "@/lib/types/types.analysis";
import { EvidenceOfFeedback } from "@/lib/types/types.interview-data";
import { cn } from "@/lib/utils";
import { useAnalysisStore } from "@/zustand/store/analysisStore";
import { useCallback, useEffect, useState, useRef } from "react";
import { ManualReportStakeholderDisplay } from "../manual-report/ManualReportStakeholderDisplay";
import { useInterviewDataStore } from "@/zustand/store/interviewDataStore";
import { ANALYSIS_TAB_NAMES } from "@/lib/constants";

export function EvidanceDisplay() {
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [newHeading, setNewHeading] = useState("");
  const [lastMergedId, setLastMergedId] = useState<string | null>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activeTemplateId = useAnalysisStore((state) => state.activeTemplateId);
  const templates = useAnalysisStore((state) => state.templates);

  const { aiCompetencies } = useInterviewDataStore();
  const setActiveTemplate = useAnalysisStore(
    (state) => state.setActiveTemplate,
  );
  const handleAnalysisUpdate = useAnalysisStore(
    (state) => state.handleAnalysisUpdate,
  );

  const templateId = templatesIds.aiCompetencies;

  useEffect(() => {
    if (activeTemplateId !== templateId) {
      setActiveTemplate(templateId);
    }
  }, [activeTemplateId, setActiveTemplate, templateId]);

  const analysisAiCompetencies = aiCompetencies?.sorted_by_competency?.data;
  const [selectedEvidanceFeedback, setSelectedEvidanceFeedback] = useState<
    string[]
  >([]);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const handleCardSelect = (cardId: string) => {
    setSelectedEvidanceFeedback((prevSelected) => {
      // If card is already selected, remove it
      if (prevSelected.includes(cardId)) {
        return prevSelected.filter((id) => id !== cardId);
      }
      // Otherwise, add it to selected cards
      const newSelected = [...prevSelected, cardId];

      // Make sure the selected item is expanded
      if (!expandedItems.includes(cardId)) {
        setExpandedItems((prev) => [...prev, cardId]);
      }

      return newSelected;
    });
  };

  const handleMerge = () => {
    if (selectedEvidanceFeedback.length < 2) return;
    setMergeDialogOpen(true);
  };

  const handleMergeConfirm = () => {
    if (!newHeading.trim() || selectedEvidanceFeedback.length < 2) return;

    const templateId = templatesIds.aiCompetencies;
    const template = templates[templateId];

    // Combine evidence from selected cards
    const mergedEvidence: EvidenceOfFeedback[] = [];
    selectedEvidanceFeedback.forEach((id) => {
      const item = template.strengths.items[id];
      if (item) {
        mergedEvidence.push(...item.evidence);
      }
    });

    // Create new card with merged evidence
    const newId = `merged-${Date.now()}`;

    // Find the highest index among selected cards
    const currentOrder = template.strengths.order;
    const selectedIndices = selectedEvidanceFeedback.map((id) =>
      currentOrder.indexOf(id),
    );
    const maxIndex = Math.max(...selectedIndices);

    // Count how many selected cards appear before the max index
    const removedBefore = selectedIndices.filter(
      (index) => index < maxIndex,
    ).length;

    // Adjust insertion index by subtracting the number of removed cards before it
    const adjustedIndex = maxIndex - removedBefore;

    // Create new order array with merged card at the right position
    const newOrder = currentOrder.filter(
      (id) => !selectedEvidanceFeedback.includes(id),
    );
    newOrder.splice(adjustedIndex, 0, newId);

    const updatedTemplate = {
      ...template,
      strengths: {
        ...template.strengths,
        items: {
          ...template.strengths.items,
          [newId]: {
            id: newId,
            heading: newHeading,
            evidence: mergedEvidence,
            content: "", // Empty content for editable card
          },
        },
        order: newOrder,
      },
    };

    // Update store with merged changes
    handleAnalysisUpdate(() => updatedTemplate);

    // Set the last merged id for scrolling
    setLastMergedId(newId);

    // Reset state
    setSelectedEvidanceFeedback([]);
    setNewHeading("");
    setMergeDialogOpen(false);
  };

  const isCardSelected = (cardId: string) => {
    return selectedEvidanceFeedback.includes(cardId);
  };

  const renderEvidence = useCallback(
    (evidence: EvidenceOfFeedback, isAreaToTarget: boolean = false) => {
      // Extract the feedback text (could be a string or an object with text property)
      const feedbackText =
        typeof evidence.feedback === "string"
          ? evidence.feedback
          : evidence.feedback.text;

      return (
        <div
          key={`${evidence.source}-${feedbackText}`}
          className={cn(
            "mb-4 p-4 rounded-lg",
            evidence.is_strong && isAreaToTarget
              ? "bg-red-50 border-l-4 border-red-500"
              : evidence.is_strong && !isAreaToTarget
                ? "bg-green-50 border-l-4 border-green-500"
                : "bg-gray-50",
          )}
        >
          <p className="text-gray-800 mb-2">{feedbackText}</p>
          <div className="text-sm text-gray-600">
            <span className="font-semibold">{evidence.source}</span>
            <span className="mx-2">•</span>
            <span>{evidence.role}</span>
          </div>
        </div>
      );
    },
    [],
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Effect to handle scrolling to merged card
  useEffect(() => {
    if (lastMergedId) {
      // Clear any existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Set new timeout
      scrollTimeoutRef.current = setTimeout(() => {
        const element = document.getElementById(lastMergedId);
        if (element) {
          const rect = element.getBoundingClientRect();
          const scrollTop =
            window.pageYOffset || document.documentElement.scrollTop;
          const top = rect.top + scrollTop;

          window.scrollTo({
            top: top - 16, // 16px offset from top
            behavior: "smooth",
          });

          setLastMergedId(null);
        }
      }, 100);
    }
  }, [lastMergedId]);

  return (
    <Tabs defaultValue="sorted-evidence" className="h-full">
      <div className="sticky top-0 bg-background z-10 pb-4">
        <TabsList className="w-full">
          <TabsTrigger value="interview-feedback" className="flex-1">
            Sorted by stakeholder
          </TabsTrigger>
          <TabsTrigger value="sorted-evidence" className="flex-1">
            {/* TODO: make it dynamic */}
            {ANALYSIS_TAB_NAMES.aiCompetencies.sortedCompetency}
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="interview-feedback" className="mt-0">
        <div className="h-full space-y-8">
          <ManualReportStakeholderDisplay />
        </div>
      </TabsContent>

      <TabsContent value="sorted-evidence" className="mt-0">
        <div className="h-full space-y-8 relative">
          {selectedEvidanceFeedback.length >= 2 && (
            <div className="fixed bottom-4 left-4 z-50">
              <Button
                onClick={handleMerge}
                className="bg-black text-white hover:bg-gray-800"
              >
                Merge Selected ({selectedEvidanceFeedback.length})
              </Button>
            </div>
          )}

          <Dialog open={mergeDialogOpen} onOpenChange={setMergeDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Merge Cards</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <Input
                  placeholder="Enter new heading for merged card"
                  value={newHeading}
                  onChange={(e) => setNewHeading(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setMergeDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleMergeConfirm}>Merge</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Strengths Section */}
          <div>
            <h2 className="text-2xl font-bold mb-6">Strengths</h2>
            <div className="space-y-6">
              <Accordion
                type="multiple"
                value={expandedItems}
                onValueChange={setExpandedItems}
              >
                {analysisAiCompetencies?.strengths.order.map((id) => {
                  const item = analysisAiCompetencies.strengths.items[id];
                  let heading = item.heading;
                  let act_as_title = false;
                  if (
                    item.heading.trim().toLowerCase() ===
                      "additional strengths" ||
                    item.heading.trim().toLowerCase() ===
                      "additional strengths."
                  ) {
                    heading = "Additional Strengths";
                    act_as_title = true;
                    if (!item.evidence.length) {
                      return null;
                    }
                  }

                  return (
                    <AccordionItem
                      value={id}
                      key={id}
                      id={id}
                      className={cn(
                        isCardSelected(id) && "border-black border rounded-lg",
                        act_as_title ? "border-none shadow-none" : "",
                      )}
                    >
                      <AccordionTrigger>
                        <div
                          className={cn(
                            "px-4 py-2",
                            act_as_title
                              ? "text-2xl font-bold"
                              : "text-lg font-semibold",
                          )}
                        >
                          <h3>{heading}</h3>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="text-base px-4 pt-2 pb-4">
                        <div
                          className={cn(
                            "space-y-4 cursor-pointer",
                            isCardSelected(id) &&
                              "border-l-4 border-black pl-3 rounded-l",
                          )}
                          onClick={() => handleCardSelect(id)}
                        >
                          {item.evidence.map((item) => renderEvidence(item))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </div>
          </div>

          {/* Areas To Target Section */}
          <div>
            <h2 className="text-2xl font-bold mb-6">Areas To Target</h2>
            <div className="space-y-6">
              <Accordion
                type="multiple"
                value={expandedItems}
                onValueChange={setExpandedItems}
              >
                {analysisAiCompetencies?.areas_to_target.order.map((id) => {
                  const item = analysisAiCompetencies.areas_to_target.items[id];
                  let heading = item.heading;
                  let act_as_title = false;
                  if (
                    item.heading.trim().toLowerCase() === "additional areas" ||
                    item.heading.trim().toLowerCase() === "additional areas."
                  ) {
                    heading = "Additional Areas To Target";
                    act_as_title = true;
                    if (!item.evidence.length) {
                      return null;
                    }
                  }

                  return (
                    <AccordionItem
                      value={id}
                      key={id}
                      className={cn(
                        act_as_title ? "border-none shadow-none" : "",
                      )}
                    >
                      <AccordionTrigger>
                        <div
                          className={cn(
                            "px-4 py-2",
                            act_as_title
                              ? "text-2xl font-bold"
                              : "text-lg font-semibold",
                          )}
                        >
                          <h3>{heading}</h3>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="text-base px-4 pt-2 pb-4">
                        <div className="space-y-4">
                          {item.evidence.map((item) =>
                            renderEvidence(item, true),
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </div>
          </div>

          {/* Advice Section */}
          <div>
            <h2 className="text-2xl font-bold mb-6">Advice</h2>
            <div className="space-y-6">
              <Accordion type="multiple" defaultValue={["advice"]}>
                <AccordionItem value="advice">
                  <AccordionTrigger>
                    <div className="px-4 py-2 text-lg font-semibold">
                      <h3>Advice</h3>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pt-2 pb-4 text-base">
                    <div className="space-y-4">
                      {analysisAiCompetencies?.advices.map((advice) => {
                        return renderEvidence({
                          feedback: {
                            text: advice.advice.join(". "),
                            is_strong: false,
                          },
                          source: advice.name.replace(/_/g, " "),
                          role: advice.role,
                        });
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
