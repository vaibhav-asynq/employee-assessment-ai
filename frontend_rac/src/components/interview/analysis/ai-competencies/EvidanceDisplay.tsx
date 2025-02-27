import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FeedbackDisplay } from "../FeedbackDisplay";
import { useInterviewDataStore } from "@/zustand/store/interviewDataStore";
import { templatesIds } from "@/lib/types/types.analysis";
import { EvidenceOfFeedback } from "@/lib/types/types.interview-data";
import { cn } from "@/lib/utils";
import { useAnalysisStore } from "@/zustand/store/analysisStore";
import { useCallback, useEffect, useState, useRef } from "react";

export function EvidanceDisplay() {
  const feedbackData = useInterviewDataStore((state) => state.feedbackData);
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [newHeading, setNewHeading] = useState("");
  const [lastMergedId, setLastMergedId] = useState<string | null>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activeTemplateId = useAnalysisStore((state) => state.activeTemplateId);
  const templates = useAnalysisStore((state) => state.templates);
  const setActiveTemplate = useAnalysisStore((state) => state.setActiveTemplate);
  const handleAnalysisUpdate = useAnalysisStore((state) => state.handleAnalysisUpdate);

  const templateId = templatesIds.aiCompetencies;

  useEffect(() => {
    if (activeTemplateId !== templateId) {
      setActiveTemplate(templateId);
    }
  }, [activeTemplateId, setActiveTemplate, templateId]);

  const analysisAiCompetencies = templates[templateId];
  const [selectedEvidanceFeedback, setSelectedEvidanceFeedback] = useState<
    string[]
  >([]);

  const handleCardSelect = (cardId: string) => {
    setSelectedEvidanceFeedback((prevSelected) => {
      // If card is already selected, remove it
      if (prevSelected.includes(cardId)) {
        return prevSelected.filter((id) => id !== cardId);
      }
      // Otherwise, add it to selected cards
      return [...prevSelected, cardId];
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
    selectedEvidanceFeedback.forEach(id => {
      const item = template.strengths.items[id];
      if (item) {
        mergedEvidence.push(...item.evidence);
      }
    });

    // Create new card with merged evidence
    const newId = `merged-${Date.now()}`;
    
    // Find the highest index among selected cards
    const currentOrder = template.strengths.order;
    const selectedIndices = selectedEvidanceFeedback.map(id => currentOrder.indexOf(id));
    const maxIndex = Math.max(...selectedIndices);
    
    // Count how many selected cards appear before the max index
    const removedBefore = selectedIndices.filter(index => index < maxIndex).length;
    
    // Adjust insertion index by subtracting the number of removed cards before it
    const adjustedIndex = maxIndex - removedBefore;
    
    // Create new order array with merged card at the right position
    const newOrder = currentOrder.filter(id => !selectedEvidanceFeedback.includes(id));
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
            content: "" // Empty content for editable card
          }
        },
        order: newOrder
      }
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
    (evidence: EvidenceOfFeedback) => (
      <div
        key={`${evidence.source}-${evidence.feedback}`}
        className="mb-4 p-4 bg-gray-50 rounded-lg"
      >
        <p className="text-gray-800 mb-2">{evidence.feedback}</p>
        <div className="text-sm text-gray-600">
          <span className="font-semibold">{evidence.source}</span>
          <span className="mx-2">•</span>
          <span>{evidence.role}</span>
        </div>
      </div>
    ),
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
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          const top = rect.top + scrollTop;
          
          window.scrollTo({
            top: top - 16, // 16px offset from top
            behavior: 'smooth'
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
          <TabsTrigger value="interview-feedback" className="flex-1">Interview Feedback</TabsTrigger>
          <TabsTrigger value="sorted-evidence" className="flex-1">Sorted Evidence</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="interview-feedback" className="mt-0">
        <div className="h-full space-y-8">
          {feedbackData ? (
            <FeedbackDisplay data={feedbackData} />
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">No feedback data available</p>
            </div>
          )}
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
            <Button variant="outline" onClick={() => setMergeDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleMergeConfirm}>
              Merge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Leadership Qualities Section */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Strengths</h2>
        <div className="space-y-6">
          {analysisAiCompetencies.strengths.order.map((id) => {
            const item = analysisAiCompetencies.strengths.items[id];
            return (
              <div id={id} key={id}>
                <Card
                  className={cn(
                    "p-4 cursor-pointer",
                    isCardSelected(id) && "border-black"
                  )}
                  onClick={() => handleCardSelect(id)}
                >
                <h3 className="text-lg font-semibold mb-4">{item.heading}</h3>
                <div className="space-y-4">
                  {item.evidence.map((item) => renderEvidence(item))}
                </div>
                </Card>
              </div>
            );
          })}
        </div>
      </div>

      {/* Development Areas Section */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Areas To Target</h2>
        <div className="space-y-6">
          {analysisAiCompetencies.areas_to_target.order.map((id) => {
            const item = analysisAiCompetencies.areas_to_target.items[id];
            return (
              <Card key={id} className="p-4">
                <h3 className="text-lg font-semibold mb-4">{item.heading}</h3>
                <div className="space-y-4">
                  {item.evidence.map((item) => renderEvidence(item))}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Advice Section */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Advice</h2>
        <div className="space-y-6">
          <Card className="p-4">
            <div className="space-y-4">
              {analysisAiCompetencies.advices.map((advice) => {
                return renderEvidence({
                  feedback: advice.advice.join(". "),
                  source: advice.name.replace(/_/g, " "),
                  role: advice.role,
                });
              })}
            </div>
          </Card>
        </div>
      </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
