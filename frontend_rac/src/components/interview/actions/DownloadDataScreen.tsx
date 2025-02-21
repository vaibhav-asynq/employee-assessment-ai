"use client";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import React, { useState } from "react";
import { ActionWrapper } from "./ActionWrapper";
import { useInterviewAnalysis } from "@/components/providers/InterviewAnalysisContext";
import { InterviewAnalysis, templatesIds } from "@/lib/types";
import { generateWordDocument } from "@/lib/api";
import { convertFromOrderedAnalysis } from "@/components/providers/utils";

export function DownloadDataScreen() {
  const [error, setError] = useState<string | null>(null);
  const { templates, selectedPath } = useInterviewAnalysis();

  //TODO: handle downloads from template, and Gracefully
  // Sometime its expecting Human report?
  // if so mention it in the types as optional, and then generate it and update the analysis template

  const orderedAnalysisData = templates[templatesIds.fullReport];
  const handleDownloadWord = async () => {
    if (!orderedAnalysisData) return;
    const analysisData = convertFromOrderedAnalysis(orderedAnalysisData);
    try {
      // Create a base report data object
      const baseReport: InterviewAnalysis = {
        name: analysisData.name,
        date: analysisData.date,
        strengths: analysisData.strengths,
        areas_to_target: analysisData.areas_to_target,
        next_steps: analysisData.next_steps,
      };

      // For Path 1, use the base report (AI suggestions)
      // For other paths, use the human report if available
      let reportData: InterviewAnalysis;
      if (selectedPath === 1) {
        reportData = baseReport;
      } else {
        reportData = analysisData.humanReport || baseReport;
      }

      const blob = await generateWordDocument(reportData);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "interview-analysis.pdf";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError("Failed to generate document. Please try again.");
    }
  };

  return (
    <ActionWrapper>
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Generate Report</h2>
        {error && <p className="my-3 text-center text-red-600">{error}</p>}
        <Button onClick={handleDownloadWord} className="w-full">
          <Download className="mr-2 h-4 w-4" />
          Download Analysis as PDF Document
        </Button>
      </div>
    </ActionWrapper>
  );
}
