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

  const filteredStrengths = {
    order: analysisAiCompetencies.strengths.order.filter(
      (o) => o.toLowerCase().trim() !== "additional strengths.",
    ),
    items: analysisAiCompetencies.strengths.items,
  };
  const filteredAreas = {
    order: analysisAiCompetencies.areas_to_target.order.filter(
      (o) => o.toLowerCase().trim() !== "additional areas.",
    ),
    items: analysisAiCompetencies.areas_to_target.items,
  };

  return (
    <div>
      <div className="overflow-scroll max-h-[100dvh] scrollbar-thin">
        {/* Strengths Section */}
        <EditStrengths
          strengths={filteredStrengths}
          templateId={templateId}
          heading="Strengths"
          promptBtnText="Prompt"
        />

        {/* Areas to Target Section */}
        <EditAreas
          areas={filteredAreas}
          templateId={templateId}
          promptBtnText="Prompt"
          heading="Areas To Target"
        />

        {/* Next Steps Section */}
        <EditNextSteps
          nextSteps={analysisAiCompetencies.next_steps}
          templateId={templateId}
        />
      </div>
    </div>
  );
}
