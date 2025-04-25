import React, { useEffect } from "react";
import { ActionWrapper } from "./ActionWrapper";
import { Button } from "@/components/ui/button";
import { useStepper } from "@/components/ui/stepper";
import { AnalysisDisplay } from "../analysis/AnalysisDisplay";
import { useInterviewDataStore } from "@/zustand/store/interviewDataStore";
import { useAnalysisStore } from "@/zustand/store/analysisStore";
import { templatesIds } from "@/lib/types/types.analysis";
import { base } from "@/lib/analysis/templates";
import { convertInterviewAnalysisDataToTemplatedData } from "@/lib/utils/analysisUtils";

function DataAnalysis() {
  const fileId = useInterviewDataStore((state) => state.fileId);
  const { goToStep } = useStepper();
  const { templates, addTemplate } = useAnalysisStore();

  // Ensure templates are initialized when component mounts
  useEffect(() => {
    // Check if templates are initialized
    const hasBaseTemplate = !!templates[templatesIds.base];
    const hasFullReportTemplate = !!templates[templatesIds.fullReport];
    const hasAiCompetenciesTemplate = !!templates[templatesIds.aiCompetencies];

    // If any template is missing, initialize empty templates
    if (!hasBaseTemplate || !hasFullReportTemplate || !hasAiCompetenciesTemplate) {
      console.log("DataAnalysis: Initializing missing templates");
      const emptyTemplate = convertInterviewAnalysisDataToTemplatedData(base);
      
      if (!hasBaseTemplate) {
        addTemplate(templatesIds.base, emptyTemplate, false, true);
      }
      
      if (!hasFullReportTemplate) {
        addTemplate(templatesIds.fullReport, emptyTemplate, false, true);
      }
      
      if (!hasAiCompetenciesTemplate) {
        addTemplate(templatesIds.aiCompetencies, emptyTemplate, false, true);
      }
    }
  }, [templates, addTemplate]);

  if (!fileId) {
    return (
      <ActionWrapper>
        <div className="flex flex-col gap-3 items-center">
          <p>Can not perform analysis</p>
          <Button
            onClick={(e) => {
              e.preventDefault();
              goToStep(1);
            }}
          >
            Upload a file first for analysis
          </Button>
        </div>
      </ActionWrapper>
    );
  }

  return (
    <ActionWrapper>
      <AnalysisDisplay />
    </ActionWrapper>
  );
}

export default DataAnalysis;
