"use client";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { EditableWordViewer } from "./EditableWordViewer";
import React, { useState, useEffect } from "react";
import { ActionWrapper } from "./ActionWrapper";
import { InterviewAnalysis } from "@/lib/types";
import { generateWordDocument } from "@/lib/api";
import { convertFromOrderedAnalysis } from "@/components/providers/utils";
import { useAnalysisStore } from "@/zustand/store/analysisStore";
import { templatesIds } from "@/lib/types/types.analysis";
import DocPreview from "../download-data/DocPreview";
import { ModifyContent } from "../download-data/DocEditor";

export function DownloadDataScreen() {
  const [error, setError] = useState<string | null>(null);
  const [docUrl, setDocUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const [editedContent, setEditedContent] = useState<string | null>(null);
  const [reportData, setReportData] = useState<InterviewAnalysis | null>(null);

  // Cleanup blob URL when component unmounts
  useEffect(() => {
    return () => {
      if (docUrl) {
        window.URL.revokeObjectURL(docUrl);
      }
    };
  }, [docUrl]);

  // const isLoading = useAnalysisStore((state) => state.loading);
  // const error = useAnalysisStore((state) => state.error);
  const templates = useAnalysisStore((state) => state.templates);
  const activeTemplateId = useAnalysisStore((state) => state.activeTemplateId);

  // Get the correct template based on the selected path
  const finalTemplateId = activeTemplateId || templatesIds.base;
  const templateFinalData = templates[finalTemplateId];

  // Generate Word document and return the URL
  const generateDoc = async (): Promise<string | null> => {
    if (!templateFinalData) return null;
    setIsLoading(true);
    setError(null);
    setPreviewError(false);

    try {
      // Always use the edited content from templateFinalData
      const analysisData = convertFromOrderedAnalysis(templateFinalData);
      const data: InterviewAnalysis = {
        name: analysisData.name,
        date: analysisData.date,
        strengths: analysisData.strengths,
        areas_to_target: analysisData.areas_to_target,
        next_steps: analysisData.next_steps,
      };
      setReportData(data);

      const blob = await generateWordDocument(data);
      console.log("Generated Word document blob:", blob);
      if (!blob) {
        throw new Error("Failed to generate document");
      }
      const url = window.URL.createObjectURL(blob);
      console.log("Created URL:", url);
      setDocUrl(url);
      return url;
    } catch (err) {
      setError("Failed to generate document. Please try again.");
      setPreviewError(true);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Handle download button click
  const handleDownload = async () => {
    let url = docUrl;
    if (!url) {
      url = await generateDoc();
    }

    if (url) {
      const a = document.createElement("a");
      a.href = url;
      a.download = "interview-analysis.docx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  //TODO: uncommment when endpoint integrated
  // // Generate document when component mounts
  // useEffect(() => {
  //   if (templateFinalData) {
  //     generateDoc();
  //   }
  // }, [templateFinalData]);

  //TODO: remove when endpoint integrated
  const [htmlContent, setHtmlContent] = useState<string>("");
  useEffect(() => {
    const fetchHtmlContent = async () => {
      try {
        const response = await fetch("/test.html");
        const content = await response.text();
        setHtmlContent(content);
      } catch (error) {
        console.error("Error fetching HTML:", error);
      }
    };

    fetchHtmlContent();
  }, []);

  return (
    <ActionWrapper>
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Generate Report</h2>
        {error && <p className="my-3 text-center text-red-600">{error}</p>}
        <Button
          onClick={handleDownload}
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          {isLoading
            ? "Generating document..."
            : "Download Analysis as Word Document"}
        </Button>

        {/* Document Preview */}

        <DocPreview
          docUrl={docUrl}
          previewError={previewError}
          reportData={reportData}
        />

        <ModifyContent htmlContentRes={htmlContent} />
      </div>
    </ActionWrapper>
  );
}
