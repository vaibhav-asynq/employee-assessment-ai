import { Card } from "@/components/ui/card";
import { templatesIds } from "@/lib/types/types.analysis";
import { EvidenceOfFeedback } from "@/lib/types/types.interview-data";
import { cn } from "@/lib/utils";
import { useAnalysisStore } from "@/zustand/store/analysisStore";
import { useCallback, useEffect, useState } from "react";

export function EvidanceDisplay() {
  const activeTemplateId = useAnalysisStore((state) => state.activeTemplateId);
  const templates = useAnalysisStore((state) => state.templates);
  const setActiveTemplate = useAnalysisStore(
    (state) => state.setActiveTemplate,
  );

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

  return (
    <div className="h-full overflow-y-auto space-y-8">
      {/* Leadership Qualities Section */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Leadership Qualities</h2>
        <div className="space-y-6">
          {analysisAiCompetencies.strengths.order.map((id) => {
            const item = analysisAiCompetencies.strengths.items[id];
            return (
              <Card
                key={id}
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
            );
          })}
        </div>
      </div>

      {/* Development Areas Section */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Areas of Development</h2>
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
  );
}
