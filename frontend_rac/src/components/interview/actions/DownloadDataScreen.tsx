"use client";
import { Button } from "@/components/ui/button";
import { Download, Edit, Eye, Loader2 } from "lucide-react";
import { EditableWordViewer } from "./EditableWordViewer";
import React, { useState, useEffect } from "react";
import { ActionWrapper } from "./ActionWrapper";
import { useInterviewAnalysis } from "@/components/providers/InterviewAnalysisContext";
import { InterviewAnalysis, templatesIds } from "@/lib/types";
import { generateWordDocument } from "@/lib/api";
import { convertFromOrderedAnalysis } from "@/components/providers/utils";

export function DownloadDataScreen() {
  const [error, setError] = useState<string | null>(null);
  const [docUrl, setDocUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedContent, setEditedContent] = useState<string | null>(null);

  // Cleanup blob URL when component unmounts
  useEffect(() => {
    return () => {
      if (docUrl) {
        window.URL.revokeObjectURL(docUrl);
      }
    };
  }, [docUrl]);
  const { templates, selectedPath } = useInterviewAnalysis();

  //TODO: handle downloads from template, and Gracefully
  // Sometime its expecting Human report?
  // if so mention it in the types as optional, and then generate it and update the analysis template

  // Get the correct template based on the selected path
  const orderedAnalysisData = selectedPath === 1 
    ? templates[templatesIds.coachCometencies]
    : selectedPath === 2
    ? templates[templatesIds.coachParagraph]
    : templates[templatesIds.fullReport];
  // Generate Word document and return the URL
  const generateDoc = async (): Promise<string | null> => {
    if (!orderedAnalysisData) return null;
    setIsLoading(true);
    setError(null);
    setPreviewError(false);
    
    try {
      // Always use the edited content from orderedAnalysisData
      const analysisData = convertFromOrderedAnalysis(orderedAnalysisData);
      const reportData: InterviewAnalysis = {
        name: analysisData.name,
        date: analysisData.date,
        strengths: analysisData.strengths,
        areas_to_target: analysisData.areas_to_target,
        next_steps: analysisData.next_steps,
      };

      const blob = await generateWordDocument(reportData);
      console.log('Generated Word document blob:', blob);
      if (!blob) {
        throw new Error('Failed to generate document');
      }
      const url = window.URL.createObjectURL(blob);
      console.log('Created URL:', url);
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

  // Generate document when component mounts
  useEffect(() => {
    if (orderedAnalysisData) {
      generateDoc();
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
          {isLoading ? "Generating document..." : "Download Analysis as Word Document"}
        </Button>
        
        {/* Toggle Edit Mode Button */}
        {docUrl && !previewError && (
          <Button
            onClick={() => setIsEditMode(!isEditMode)}
            variant="outline"
            className="w-full mt-2"
          >
            {isEditMode ? (
              <>
                <Eye className="mr-2 h-4 w-4" />
                View Mode
              </>
            ) : (
              <>
                <Edit className="mr-2 h-4 w-4" />
                Edit Mode
              </>
            )}
          </Button>
        )}

        {/* Document Preview */}
        {docUrl && !previewError && (
          <div className="mt-4">
            <div className="flex justify-between items-center text-sm text-gray-500 mb-2">
              <span>{isEditMode ? "Edit Document:" : "Document Preview:"}</span>
              {!isEditMode && (
                <a 
                  href={docUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                >
                  Open in new tab
                </a>
              )}
            </div>
            {isEditMode && docUrl ? (
              <EditableWordViewer 
                documentUrl={docUrl}
                onContentChange={(content) => setEditedContent(content)}
              />
            ) : (
              <div className="w-full h-[900px] border rounded-lg p-4">
                <p className="text-center">
                  Document preview not available in view mode. Please switch to edit mode to view and edit the document.
                </p>
                <div className="text-center mt-4">
                  <a 
                    href={docUrl} 
                    download 
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Download Word Document
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
        
        {previewError && (
          <div className="mt-4 p-4 text-red-600 bg-red-50 rounded-lg">
            <p>Failed to load document preview.</p>
            <p className="mt-2">
              You can still{' '}
              {docUrl && (
                <>
                  <a 
                    href={docUrl} 
                    className="underline hover:text-red-800"
                    download
                  >
                    download the document
                  </a>
                  {' '}or{' '}
                  <a 
                    href={docUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline hover:text-red-800"
                  >
                    open it in a new tab
                  </a>
                </>
              )}.
            </p>
          </div>
        )}
      </div>
    </ActionWrapper>
  );
}
