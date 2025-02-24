"use client";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Upload } from "lucide-react";
import React, { useState, useEffect } from "react";
import { ActionWrapper } from "./ActionWrapper";
import { InterviewAnalysis } from "@/lib/types";
import { generateWordDocument, generatePdfDocument, uploadUpdatedReport } from "@/lib/api";
import { useAnalysisStore } from "@/zustand/store/analysisStore";
import { templatesIds } from "@/lib/types/types.analysis";
import DocPreview from "../download-data/DocPreview";
import { convertFromOrderedAnalysis, convertInterviewAnalysisDataToTemplatedData } from "@/lib/utils/analysisUtils";
export function DownloadDataScreen() {
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [wordUrl, setWordUrl] = useState<string | null>(null);
  const [isPdfLoading, setPdfLoading] = useState(false);
  const [isWordLoading, setWordLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [reportData, setReportData] = useState<InterviewAnalysis | null>(null);

  const templates = useAnalysisStore((state) => state.templates);
  const activeTemplateId = useAnalysisStore((state) => state.activeTemplateId);
  const handleAnalysisUpdate = useAnalysisStore((state) => state.handleAnalysisUpdate);

  const finalTemplateId = activeTemplateId || templatesIds.base;
  const templateFinalData = templates[finalTemplateId];

  const generatePdf = async () => {
    if (!templateFinalData) return null;
    setPdfLoading(true);
    setError(null);

    try {
      const analysisData = convertFromOrderedAnalysis(templateFinalData);
      const data: InterviewAnalysis = {
        name: analysisData.name,
        date: analysisData.date,
        strengths: analysisData.strengths,
        areas_to_target: analysisData.areas_to_target,
        next_steps: analysisData.next_steps,
      };
      setReportData(data);

      // Generate PDF document
      const pdfBlob = await generatePdfDocument(data);
      if (!pdfBlob) {
        throw new Error("Failed to generate document");
      }
      const url = window.URL.createObjectURL(pdfBlob);
      setPdfUrl(url);
      return url;
    } catch (err) {
      setError("Failed to generate document. Please try again.");
      return null;
    } finally {
      setPdfLoading(false);
    }
  };

  const generateWord = async () => {
    if (!templateFinalData) return null;
    setWordLoading(true);
    setError(null);

    try {
      const analysisData = convertFromOrderedAnalysis(templateFinalData);
      const data: InterviewAnalysis = {
        name: analysisData.name,
        date: analysisData.date,
        strengths: analysisData.strengths,
        areas_to_target: analysisData.areas_to_target,
        next_steps: analysisData.next_steps,
      };

      const wordBlob = await generateWordDocument(data);
      if (!wordBlob) {
        throw new Error("Failed to generate document");
      }
      const url = window.URL.createObjectURL(wordBlob);
      setWordUrl(url);
      return url;
    } catch (err) {
      setError("Failed to generate document. Please try again.");
      return null;
    } finally {
      setWordLoading(false);
    }
  };

  // Generate PDF for preview when component mounts
  useEffect(() => {
    if (templateFinalData) {
      generatePdf();
    }
  }, [templateFinalData]);

  const handleDownload = async (type: 'pdf' | 'word') => {
    try {
      if (type === 'pdf') {
        let url = pdfUrl;
        if (!url) {
          url = await generatePdf();
        }
        if (url) {
          const a = document.createElement("a");
          a.href = url;
          a.download = "interview-analysis.pdf";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
      } else {
        const url = await generateWord();
        if (url) {
          const a = document.createElement("a");
          a.href = url;
          a.download = "interview-analysis.docx";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          setWordUrl(null); // Clear Word URL after download
        }
      }
    } catch (err) {
      setError("Failed to download document. Please try again.");
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if file is a Word document
    if (!file.name.endsWith('.docx')) {
      setError('Please upload a Word document (.docx)');
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadSuccess(false);

    try {
      const data = await uploadUpdatedReport(file);

      // Convert to TemplatedData format
      const templatedData = convertInterviewAnalysisDataToTemplatedData(data);
      

      // Update current template
      handleAnalysisUpdate(() => templatedData);
      
      setUploadSuccess(true);
      event.target.value = ''; // Reset file input
    } catch (err) {
      setError('Failed to upload document. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <ActionWrapper>
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Generate Report</h2>
        {error && <p className="my-3 text-center text-red-600">{error}</p>}
        {uploadSuccess && (
          <p className="my-3 text-center text-green-600">Document uploaded successfully!</p>
        )}
        <div className="flex gap-4">
          <Button
            onClick={() => handleDownload('pdf')}
            className="flex-1"
            disabled={isPdfLoading}
          >
            {isPdfLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {isPdfLoading
              ? "Generating document..."
              : "Download as PDF"}
          </Button>
          <Button
            onClick={() => handleDownload('word')}
            className="flex-1"
            disabled={isWordLoading}
          >
            {isWordLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {isWordLoading
              ? "Generating document..."
              : "Download as Word"}
          </Button>
        </div>

        <div className="mt-4">
          <input
            type="file"
            accept=".docx"
            onChange={handleFileUpload}
            className="hidden"
            id="report-upload"
          />
          <Button
            onClick={() => document.getElementById('report-upload')?.click()}
            className="w-full border-2"
            variant="outline"
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            {isUploading
              ? "Uploading..."
              : "Upload Updated Report (Docx)"}
          </Button>
        </div>

        <DocPreview
          docUrl={pdfUrl}
          reportData={reportData}
        />
      </div>
    </ActionWrapper>
  );
}
