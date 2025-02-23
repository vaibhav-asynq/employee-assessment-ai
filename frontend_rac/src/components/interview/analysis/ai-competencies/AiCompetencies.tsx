"use client";
import React, { useCallback, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useAnalysisStore } from "@/zustand/store/analysisStore";
import { EditableCopetencies } from "./EditableCopetencies";
import { templatesIds } from "@/lib/types/types.analysis";
import { EvidenceOfFeedback } from "@/lib/types/types.interview-data";

export function AiCompetencies() {
  const isLoading = useAnalysisStore((state) => state.loading);
  const error = useAnalysisStore((state) => state.error);
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">{error}</div>;
  }

  return (
    <div className="grid grid-cols-2 gap-8 h-full">
      {/* Left side - Evidence Display */}
      <div className="h-full overflow-y-auto space-y-8">
        {/* Leadership Qualities Section */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Leadership Qualities</h2>
          <div className="space-y-6">
            {analysisAiCompetencies.strengths.order.map((id) => {
              const item = analysisAiCompetencies.strengths.items[id];
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

      {/* Right side - Editable Content */}
      <div className="border-l pl-8">
        <EditableCopetencies />
      </div>
    </div>
  );
}
