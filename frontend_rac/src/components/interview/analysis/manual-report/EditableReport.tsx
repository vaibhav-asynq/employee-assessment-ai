import React, { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { templatesIds } from "@/lib/types";
import { useAnalysisStore } from "@/zustand/store/analysisStore";
import { EditStrengths } from "../editables/EditStrengths";
import { EditAreas } from "../editables/EditAreas";
import { EditNextSteps } from "../editables/EditNextSteps";

export function EditableReport() {
  const templates = useAnalysisStore((state) => state.templates);
  const activeTemplateId = useAnalysisStore((state) => state.activeTemplateId);
  const setActiveTemplate = useAnalysisStore(
    (state) => state.setActiveTemplate,
  );

  const templateId = templatesIds.base;

  useEffect(() => {
    if (activeTemplateId !== templateId) {
      setActiveTemplate(templateId);
    }
  }, [activeTemplateId, setActiveTemplate, templateId]);

  const analysisManualReport = templates[templateId];

  if (!analysisManualReport) {
    return (
      <>
        <div className="grid place-items-center animate-spin w-full">
          <Loader2 />
        </div>
      </>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight mb-8">AI Suggestions</h2>

      {/* Strength Section */}
      <EditStrengths
        strengths={analysisManualReport.strengths}
        templateId={templateId}
        promptBtnText="Prompt"
      />

      {/* Areas to Target Section */}
      <EditAreas
        areas={analysisManualReport.areas_to_target}
        templateId={templateId}
        promptBtnText="Prompt"
      />

      {/* Next Steps Section */}

      <EditNextSteps
        nextSteps={analysisManualReport.next_steps}
        templateId={templateId}
      />
    </div>
  );
}
