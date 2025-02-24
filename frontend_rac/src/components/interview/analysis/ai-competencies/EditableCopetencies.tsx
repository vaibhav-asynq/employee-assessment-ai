import React, { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useAnalysisStore } from "@/zustand/store/analysisStore";
import { templatesIds } from "@/lib/types/types.analysis";
import { EditStrengths } from "../editables/EditStrengths";
import { EditAreas } from "../editables/EditAreas";
import { EditNextSteps } from "../editables/EditNextSteps";

export function EditableCopetencies() {
  const templates = useAnalysisStore((state) => state.templates);
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

  const analysisAiCompetencies = templates[templateId];

  if (!analysisAiCompetencies) {
    return (
      <>
        <div className="grid place-items-center animate-spin w-full">
          <Loader2 />
        </div>
      </>
    );
  }

  return (
    <div className="p-6">
      {/* Strengths Section */}
      <EditStrengths
        strengths={analysisAiCompetencies.strengths}
        templateId={templateId}
        heading="Leadership Qualities"
        promptBtnText="Prompt"
      />

      {/* Areas to Target Section */}
      <EditAreas
        areas={analysisAiCompetencies.areas_to_target}
        templateId={templateId}
        promptBtnText="Prompt"
        heading="Areas of Development"
      />

      {/* Next Steps Section */}
      <EditNextSteps
        nextSteps={analysisAiCompetencies.next_steps}
        templateId={templateId}
      />
    </div>
  );
}
