import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UploadSection } from './UploadSection';
import { RawDataSplitScreen } from './RawDataSplitScreen';
import { SplitScreenAnalysis } from './SplitScreenAnalysis';
import { uploadFile, generateReport, generateWordDocument, getRawData } from '@/lib/api';
import { InterviewAnalysis as InterviewAnalysisType } from '@/lib/types';
import { Download } from 'lucide-react';

interface ExtendedInterviewAnalysis extends InterviewAnalysisType {
  humanReport?: InterviewAnalysisType;
  aiSuggestions?: InterviewAnalysisType;
}

export function InterviewAnalysis() {
  const [activeStep, setActiveStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysisData, setAnalysisData] = useState<ExtendedInterviewAnalysis | null>(null);
  const [rawData, setRawData] = useState<any>(null);
  const [uploadProgress, setUploadProgress] = useState<'uploading' | 'processing' | null>(null);
  const [fileId, setFileId] = useState<string | null>(null);
  const [editableContent, setEditableContent] = useState<{
    strengths: { [key: string]: { title: string; content: string } };
    areas_to_target: { [key: string]: { title: string; content: string } };
    next_steps: Array<string | { main: string; sub_points: string[] }>;
  }>({
    strengths: {},
    areas_to_target: {},
    next_steps: []
  });

  // Initialize editable content when raw data changes
  useEffect(() => {
    if (rawData && analysisData) {
      // Only initialize if not already populated
      if (Object.keys(editableContent.strengths).length === 0) {
        setEditableContent(prev => ({
          strengths: Object.fromEntries(
            Object.keys(analysisData.strengths).map(key => [key, { title: key, content: '' }])
          ),
          areas_to_target: Object.fromEntries(
            Object.keys(analysisData.areas_to_target).map(key => [key, { title: key, content: '' }])
          ),
          next_steps: prev.next_steps
        }));
      }
    }
  }, [rawData, analysisData]);

  // Initialize next steps when analysis data changes
  useEffect(() => {
    if (analysisData && editableContent.next_steps.length === 0) {
      setEditableContent(prev => ({
        ...prev,
        next_steps: analysisData.next_steps.map(step => {
          if (typeof step === 'string') {
            return '';
          } else {
            return {
              main: '',
              sub_points: step.sub_points.map(() => '')
            };
          }
        })
      }));
    }
  }, [analysisData]);

  useEffect(() => {
    if (activeStep === 2 && fileId && !rawData) {
      fetchRawData();
    }
  }, [activeStep, fileId, rawData]);

  const fetchRawData = async () => {
    if (!fileId) return;
    setLoading(true);
    try {
      console.log('Fetching raw data for fileId:', fileId);
      const data = await getRawData(fileId);
      console.log('Raw data received:', data);
      setRawData(data);
    } catch (err) {
      console.error('Error fetching raw data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch raw interview data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;
    
    if (uploadedFile.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      return;
    }
    setFile(uploadedFile);
    setError('');
    setUploadProgress('uploading');
    
    try {
      setLoading(true);
      const id = await uploadFile(uploadedFile);
      console.log('File uploaded, ID:', id);
      setFileId(id);
      setUploadProgress('processing');
      const data = await generateReport(id);
      console.log('Report generated:', data);
      setAnalysisData(data);
      setActiveStep(2);
      setUploadProgress(null);
      // Reset rawData when a new file is uploaded
      setRawData(null);
    } catch (err) {
      console.error('Error during file upload or report generation:', err);
      setError(err instanceof Error ? err.message : 'Failed to process the interview. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadWord = async () => {
    if (!analysisData) return;
    try {
      // Extract the base InterviewAnalysis data
      const reportData: InterviewAnalysisType = analysisData.humanReport || {
        name: analysisData.name,
        date: analysisData.date,
        strengths: analysisData.strengths,
        areas_to_target: analysisData.areas_to_target,
        next_steps: analysisData.next_steps
      };
      const blob = await generateWordDocument(reportData);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'interview-analysis.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Failed to generate document. Please try again.');
    }
  };

  const handleStepChange = (newStep: number) => {
    if (newStep === 3 && activeStep === 2) {
      // Moving from step 2 to 3
      const humanReport: InterviewAnalysisType = {
        ...analysisData!,
        strengths: Object.fromEntries(
          Object.entries(editableContent.strengths).map(([key, value]) => [value.title, value.content])
        ),
        areas_to_target: Object.fromEntries(
          Object.entries(editableContent.areas_to_target).map(([key, value]) => [value.title, value.content])
        ),
        next_steps: editableContent.next_steps
      };

      // If we already have humanReport and aiSuggestions, preserve them
      if (analysisData?.humanReport && analysisData?.aiSuggestions) {
        setAnalysisData({
          ...analysisData,
          humanReport
        });
      } else {
        setAnalysisData({
          ...analysisData!,
          humanReport,
          aiSuggestions: {
            name: analysisData!.name,
            date: analysisData!.date,
            strengths: analysisData!.strengths,
            areas_to_target: analysisData!.areas_to_target,
            next_steps: analysisData!.next_steps
          }
        });
      }
    } else if (newStep === 2 && activeStep === 3 && analysisData?.humanReport) {
      // Moving from step 3 to 2, update editableContent with current humanReport data
      setEditableContent({
        strengths: Object.fromEntries(
          Object.entries(analysisData.humanReport.strengths).map(([key, value]) => [
            key,
            { title: key, content: value }
          ])
        ),
        areas_to_target: Object.fromEntries(
          Object.entries(analysisData.humanReport.areas_to_target).map(([key, value]) => [
            key,
            { title: key, content: value }
          ])
        ),
        next_steps: analysisData.humanReport.next_steps
      });
    }
    setActiveStep(newStep);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Interview Analysis Dashboard</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => handleStepChange(Math.max(1, activeStep - 1))}
            disabled={activeStep === 1}
          >
            Previous
          </Button>
          <Button 
            onClick={() => handleStepChange(Math.min(4, activeStep + 1))}
            disabled={activeStep === 4 || !analysisData}
          >
            Next
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2 mb-8">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={`h-2 rounded ${
              step <= activeStep ? 'bg-blue-500' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      <Card>
        <CardContent className="p-6">
          {activeStep === 1 && (
            <UploadSection 
              loading={loading}
              file={file}
              onFileUpload={handleFileUpload}
              uploadProgress={uploadProgress}
            />
          )}
          {activeStep === 2 && (
            <RawDataSplitScreen
              rawData={rawData}
              loading={loading}
              error={error}
              editableContent={editableContent}
              setEditableContent={setEditableContent}
            />
          )}
          {activeStep === 3 && analysisData?.humanReport && analysisData?.aiSuggestions && (
            <SplitScreenAnalysis 
              data={analysisData.humanReport}
              aiSuggestions={analysisData.aiSuggestions}
              onUpdate={(updatedData) => {
                setAnalysisData(prev => ({
                  ...prev!,
                  humanReport: updatedData
                }));
              }}
            />
          )}
          {activeStep === 4 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Generate Report</h2>
              <Button
                onClick={handleDownloadWord}
                className="w-full"
              >
                <Download className="mr-2 h-4 w-4" />
                Download Analysis as PDF Document
              </Button>
            </div>
          )}
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
