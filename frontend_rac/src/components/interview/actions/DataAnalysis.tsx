import React, { useEffect, useState } from "react";
import { ActionWrapper } from "./ActionWrapper";
import { Button } from "@/components/ui/button";
import { useStepper } from "@/components/ui/stepper";
import { AnalysisDisplay } from "../analysis/AnalysisDisplay";
import { useInterviewDataStore } from "@/zustand/store/interviewDataStore";
import { useAnalysisStore } from "@/zustand/store/analysisStore";
import { templatesIds } from "@/lib/types/types.analysis";
import { base } from "@/lib/analysis/templates";
import { convertInterviewAnalysisDataToTemplatedData } from "@/lib/utils/analysisUtils";
import { useSnapshotLoader } from "@/hooks/useSnapshotLoader";
import { Loader2 } from "lucide-react";

function DataAnalysis() {
  const fileId = useInterviewDataStore((state) => state.fileId);
  const { goToStep } = useStepper();
  const { templates, addTemplate } = useAnalysisStore();
  const { loadSnapshot } = useSnapshotLoader(null, false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Try to load the latest snapshot when the component mounts or fileId changes
  useEffect(() => {
    if (!fileId) return;
    
    // Check if templates are already initialized
    const hasTemplates = 
      templates && 
      Object.keys(templates).length >= 3 && 
      templates[templatesIds.base] && 
      templates[templatesIds.fullReport] && 
      templates[templatesIds.aiCompetencies];
    
    // If templates are not initialized, try to load the latest snapshot
    if (!hasTemplates) {
      setLoading(true);
      setError(null);
      
      console.log("DataAnalysis: Attempting to load latest snapshot for fileId:", fileId);
      
      // Store the fileId in localStorage to persist between sessions
      localStorage.setItem('LAST_LOADED_FILE_ID', fileId);
      
      loadSnapshot(null)
        .then(data => {
          if (data) {
            console.log("DataAnalysis: Latest snapshot loaded successfully");
            // Store the snapshot ID in localStorage
            if (data.id) {
              localStorage.setItem('LAST_LOADED_SNAPSHOT_ID', data.id.toString());
            }
          } else {
            console.log("DataAnalysis: No snapshot found, using empty templates");
          }
        })
        .catch(err => {
          console.error("DataAnalysis: Error loading snapshot:", err);
          setError("Failed to load snapshot. Using empty templates instead.");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [fileId, loadSnapshot, templates]);
  
  // Restore last loaded snapshot on page refresh
  useEffect(() => {
    // Only run this effect once on component mount
    const lastFileId = localStorage.getItem('LAST_LOADED_FILE_ID');
    const lastSnapshotId = localStorage.getItem('LAST_LOADED_SNAPSHOT_ID');
    
    if (lastFileId && fileId === lastFileId && lastSnapshotId && !loading) {
      console.log("Restoring last loaded snapshot:", lastSnapshotId);
      
      // Check if templates are already initialized
      const hasTemplates = 
        templates && 
        Object.keys(templates).length >= 3 && 
        templates[templatesIds.base] && 
        templates[templatesIds.fullReport] && 
        templates[templatesIds.aiCompetencies];
      
      // Only load if templates are not already initialized
      if (!hasTemplates) {
        setLoading(true);
        loadSnapshot(parseInt(lastSnapshotId))
          .then(data => {
            if (data) {
              console.log("Last snapshot restored successfully");
            } else {
              console.log("Failed to restore last snapshot, using empty templates");
            }
          })
          .catch(err => {
            console.error("Error restoring last snapshot:", err);
          })
          .finally(() => {
            setLoading(false);
          });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fallback: Ensure templates are initialized when component mounts
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

  if (loading) {
    return (
      <ActionWrapper>
        <div className="grid place-items-center w-full h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg font-medium text-gray-700">
              Loading latest snapshot...
            </p>
            <p className="text-sm text-gray-500 max-w-md text-center">
              Retrieving the most recent report data for this task.
            </p>
          </div>
        </div>
      </ActionWrapper>
    );
  }

  if (error) {
    return (
      <ActionWrapper>
        <div className="grid place-items-center w-full">
          <div className="flex flex-col items-center gap-4 max-w-md text-center">
            <p className="text-xl font-semibold text-amber-600">Snapshot Loading Error</p>
            <p className="text-gray-600">{error}</p>
            <p className="text-sm text-gray-500">
              Continuing with empty templates. Your changes will be saved as a new snapshot.
            </p>
          </div>
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
