"use client";
import React, { useEffect } from "react";
import { Spinner } from "@/components/ui/spinner";
import { useAnalysisStore } from "@/zustand/store/analysisStore";
import { EditableCopetencies } from "./EditableCopetencies";
import { templatesIds } from "@/lib/types/types.analysis";
import { EvidanceDisplay } from "./EvidanceDisplay";

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
    <div className="grid grid-cols-2 gap-8 h-full">
      {/* Left side - Evidence Display */}
      <EvidanceDisplay />

      {/* Right side - Editable Content */}
      <div className="border-l pl-4">
        <EditableCopetencies />
      </div>
    </div>
  );
}
