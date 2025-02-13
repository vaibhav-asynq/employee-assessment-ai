import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UploadSection } from './UploadSection';
import { EditableAnalysis } from './EditableAnalysis';
import { Path4HumanReport } from './Path4HumanReport';
import { uploadFile, generateReport, generateWordDocument, getRawData, getFeedbackData } from '@/lib/api';
import { InterviewAnalysis as InterviewAnalysisType } from '@/lib/types';
import { Download } from 'lucide-react';
import { FeedbackScreen } from './FeedbackScreen';
import { PathSelectionScreen } from './PathSelectionScreen';
import { DevelopmentalResources } from './DevelopmentalResources';
import { FeedbackDisplay } from './FeedbackDisplay';

interface ExtendedInterviewAnalysis extends InterviewAnalysisType {
  humanReport?: InterviewAnalysisType;
  aiSuggestions?: InterviewAnalysisType;
}

export function InterviewAnalysis() {
  const [activeStep, setActiveStep] = useState(1);
  const [selectedPath, setSelectedPath] = useState<number | null>(null);
  const [feedbackData, setFeedbackData] = useState<any>(null);
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
    if ((activeStep === 2 || activeStep === 4) && !feedbackData) {
      fetchFeedbackData();
    }
    if (activeStep === 4 && fileId && !rawData) {
      fetchRawData();
    }
  }, [activeStep, fileId, rawData, feedbackData]);

  const fetchFeedbackData = async () => {
    setLoading(true);
    try {
      console.log('Fetching feedback data...');
      const data = await getFeedbackData();
      console.log('Feedback data received:', data);
      if (!data) {
        throw new Error('No feedback data received');
      }
      setFeedbackData(data);
    } catch (err) {
      console.error('Error fetching feedback data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch feedback data');
    } finally {
      setLoading(false);
    }
  };

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
      // Create a base report data object
      const baseReport: InterviewAnalysisType = {
        name: analysisData.name,
        date: analysisData.date,
        strengths: analysisData.strengths,
        areas_to_target: analysisData.areas_to_target,
        next_steps: analysisData.next_steps
      };

      // For Path 1, use the base report (AI suggestions)
      // For Path 4, use the human report without next steps
      // For other paths, use the human report if available
      let reportData: InterviewAnalysisType;
      if (selectedPath === 1) {
        reportData = baseReport;
      } else if (selectedPath === 4) {
        reportData = {
          name: analysisData.name,
          date: analysisData.date,
          strengths: analysisData.humanReport?.strengths || analysisData.strengths,
          areas_to_target: analysisData.humanReport?.areas_to_target || analysisData.areas_to_target,
          next_steps: [] // Empty array for Path 4
        };
      } else {
        reportData = analysisData.humanReport || baseReport;
      }

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
    if (newStep > getTotalSteps()) return;
    
    if (newStep === 5 && activeStep === 4) {
      if (selectedPath === 1) {
        // For Path 1, use the current AI suggestions as the report
        const baseReport: InterviewAnalysisType = {
          name: analysisData!.name,
          date: analysisData!.date,
          strengths: analysisData!.strengths,
          areas_to_target: analysisData!.areas_to_target,
          next_steps: analysisData!.next_steps
        };
        setAnalysisData({
          ...analysisData!,
          humanReport: baseReport
        });
      } else if (selectedPath === 4) {
        // For Path 4, use only strengths and areas to target
        const humanReport: InterviewAnalysisType = {
          ...analysisData!,
          strengths: Object.fromEntries(
            Object.entries(editableContent.strengths).map(([key, value]) => [value.title, value.content])
          ),
          areas_to_target: Object.fromEntries(
            Object.entries(editableContent.areas_to_target).map(([key, value]) => [value.title, value.content])
          ),
          next_steps: [] // Empty array for Path 4
        };
        setAnalysisData({
          ...analysisData!,
          humanReport
        });
      } else {
        // For other paths, use the editable content
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
      }
    } else if (newStep === 4 && activeStep === 5 && analysisData?.humanReport) {
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

  const getTotalSteps = () => {
    // First 3 steps are common: Upload, Feedback, Path Selection
    if (!selectedPath) return 3;

    switch (selectedPath) {
      case 1:
        // Path 1: Upload -> Feedback -> Path Selection -> Split Screen -> Download
        return 5;
      case 2:
      case 3:
      case 4:
        // Other paths: Upload -> Feedback -> Path Selection -> Split Screen
        return 4;
      default:
        return 3;
    }
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
            onClick={() => handleStepChange(activeStep + 1)}
            disabled={activeStep === getTotalSteps() || !analysisData}
          >
            Next
          </Button>
        </div>
      </div>
      <div className="grid gap-2 mb-8" style={{ gridTemplateColumns: `repeat(${getTotalSteps()}, minmax(0, 1fr))` }}>
        {Array.from({ length: getTotalSteps() }).map((_, index) => (
          <div
            key={index + 1}
            className={`h-2 rounded ${
              index + 1 <= activeStep ? 'bg-blue-500' : 'bg-gray-200'
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
          {activeStep === 2 && feedbackData && (
            <FeedbackScreen data={feedbackData} />
          )}
          {activeStep === 3 && (
            <PathSelectionScreen 
              onSelectPath={(path) => {
                setSelectedPath(path);
                setActiveStep(4);
              }}
            />
          )}
          {activeStep === 4 && (
            <div className="grid grid-cols-2 gap-8">
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold">Interview Feedback</h2>
                </div>
                {loading ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">Loading feedback data...</p>
                  </div>
                ) : feedbackData ? (
                  <FeedbackDisplay data={feedbackData} />
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600">No feedback data available</p>
                  </div>
                )}
              </div>
              <div className="border-l pl-8">
                {analysisData && (
                  selectedPath === 4 ? (
                    <Path4HumanReport 
                      data={analysisData} 
                      onUpdate={(updatedData) => {
                        setAnalysisData(prev => {
                          if (!prev) return prev;
                          return {
                            ...prev,
                            ...updatedData,
                            next_steps: [] // Keep next_steps empty for Path 4
                          };
                        });
                      }}
                    />
                  ) : (
                    <EditableAnalysis 
                      data={analysisData} 
                      onUpdate={(updatedData) => {
                        setAnalysisData({
                          ...analysisData,
                          ...updatedData
                        });
                      }}
                    />
                  )
                )}
              </div>
            </div>
          )}
          {activeStep === 5 && selectedPath === 1 && (
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
