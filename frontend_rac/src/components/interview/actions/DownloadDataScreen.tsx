"use client";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import React, { useState, useEffect } from "react";
import { ActionWrapper } from "./ActionWrapper";
import { useInterviewAnalysis } from "@/components/providers/InterviewAnalysisContext";
import { InterviewAnalysis, templatesIds } from "@/lib/types";
import { generateWordDocument } from "@/lib/api";
import { convertFromOrderedAnalysis } from "@/components/providers/utils";

export function DownloadDataScreen() {
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [previewError, setPreviewError] = useState(false);

  // Cleanup blob URL when component unmounts
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        window.URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);
  const { templates, selectedPath } = useInterviewAnalysis();

  //TODO: handle downloads from template, and Gracefully
  // Sometime its expecting Human report?
  // if so mention it in the types as optional, and then generate it and update the analysis template

  const orderedAnalysisData = templates[templatesIds.fullReport];
  // Generate PDF and return the URL
  const generatePDF = async () => {
    if (!orderedAnalysisData) return;
    setIsLoading(true);
    setError(null);
    setPreviewError(false);
    
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
      console.log('Generated PDF blob:', blob);
      const url = window.URL.createObjectURL(blob);
      console.log('Created URL:', url);
      setPdfUrl(url);
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
    let url = pdfUrl;
    if (!url) {
      url = await generatePDF();
    }
    
    if (url) {
      const a = document.createElement("a");
      a.href = url;
      a.download = "interview-analysis.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  // Generate PDF when component mounts
  useEffect(() => {
    if (orderedAnalysisData) {
      generatePDF();
    }
  }, [orderedAnalysisData]);

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
          {isLoading ? "Generating PDF..." : "Download Analysis as PDF Document"}
        </Button>
        
        {/* PDF Preview */}
        {pdfUrl && !previewError && (
          <div className="mt-4">
            <div className="flex justify-between items-center text-sm text-gray-500 mb-2">
              <span>PDF Preview:</span>
              <a 
                href={pdfUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800"
              >
                Open in new tab
              </a>
            </div>
            <object 
              data={pdfUrl}
              type="application/pdf"
              className="w-full h-[900px] border rounded-lg"
            >
              <div className="p-4 text-center">
                <p>Unable to display PDF preview.</p>
                <a 
                  href={pdfUrl} 
                  download 
                  className="text-blue-600 hover:text-blue-800"
                >
                  Download PDF
                </a>
              </div>
            </object>
          </div>
        )}
        
        {previewError && (
          <div className="mt-4 p-4 text-red-600 bg-red-50 rounded-lg">
            <p>Failed to load PDF preview.</p>
            <p className="mt-2">
              You can still{' '}
              <a 
                href={pdfUrl} 
                className="underline hover:text-red-800"
                download
              >
                download the document
              </a>
              {' '}or{' '}
              <a 
                href={pdfUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline hover:text-red-800"
              >
                open it in a new tab
              </a>.
            </p>
          </div>
        )}
      </div>
    </ActionWrapper>
  );
}
