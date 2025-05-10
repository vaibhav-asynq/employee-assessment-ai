"use client";
import React, { useEffect } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Spinner } from "@/components/ui/spinner";
import { useAnalysisStore } from "@/zustand/store/analysisStore";
import { EditableCopetencies } from "./EditableCopetencies";
import { templatesIds } from "@/lib/types/types.analysis";
import { EvidanceDisplay } from "./EvidanceDisplay";
import FallbackAiCompetencies from "./fallbacks/FallbackAiCompetencies";
import { FallbackAiCompetenciesDisplay } from "./fallbacks/FallbackAiCompetenciesDisplay";

export function AiCompetencies() {
  const isLoading = useAnalysisStore((state) => state.loading);
  const error = useAnalysisStore((state) => state.error);
  const activeTemplateId = useAnalysisStore((state) => state.activeTemplateId);
  const setActiveTemplate = useAnalysisStore(
    (state) => state.setActiveTemplate,
  );

  const templateId = templatesIds.aiCompetencies;

  useEffect(() => {
    if (activeTemplateId !== templateId) {
      setActiveTemplate(templateId);
    }
  }, [activeTemplateId, setActiveTemplate, templateId]);

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
    <ErrorBoundary FallbackComponent={FallbackAiCompetencies}>
      <div className="grid grid-cols-2 gap-8">
        {/* Left side - Evidence Display */}
        <div className="overflow-y-auto pr-4">
          <ErrorBoundary FallbackComponent={FallbackAiCompetenciesDisplay}>
            <EvidanceDisplay />
          </ErrorBoundary>
        </div>

        {/* Right side - Editable Content */}
        <div className="border-l pl-4 overflow-y-auto p-6">
          <EditableCopetencies />
        </div>
      </div>
    </ErrorBoundary>
  );
}
