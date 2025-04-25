"use client";
import React, { useEffect } from "react";
import { templatesIds } from "@/lib/types";
import { useAnalysisStore } from "@/zustand/store/analysisStore";
import { EditStrengths } from "../editables/EditStrengths";
import { EditAreas } from "../editables/EditAreas";
import { EditNextSteps } from "../editables/EditNextSteps";
import { Loader2 } from "lucide-react";

export function EditableReport() {
  const templates = useAnalysisStore((state) => state.templates);
  const activeTemplateId = useAnalysisStore((state) => state.activeTemplateId);
  const setActiveTemplate = useAnalysisStore(
    (state) => state.setActiveTemplate,
  );

  const templateId = templatesIds.fullReport;
  useEffect(() => {
    if (activeTemplateId !== templateId) {
      setActiveTemplate(templateId);
    }
  }, [activeTemplateId, setActiveTemplate, templateId]);

  const analysisFullReport = templates[templateId];

  if (!analysisFullReport) {
    return (
      <>
        <div className="grid place-items-center animate-spin w-full">
          <Loader2 />
        </div>
      </>
    );
  }

  console.log(analysisFullReport.strengths);

  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight mb-8">AI Suggestions</h2>

      {/* Strengths Section */}
      <EditStrengths
        strengths={analysisFullReport.strengths}
        templateId={templateId}
        promptBtnText="Prompt"
      />

      {/* Areas to Target Section */}
      <EditAreas
        areas={analysisFullReport.areas_to_target}
        templateId={templateId}
        promptBtnText="Prompt"
      />

      {/* Next Steps Section */}
      <EditNextSteps
        nextSteps={analysisFullReport.next_steps}
        templateId={templateId}
      />
    </div>
  );
}
