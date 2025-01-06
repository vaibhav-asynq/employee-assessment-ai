// src/components/interview/InterviewAnalysis.tsx
'use client'
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UploadSection } from './UploadSection';
import { EditSection } from './EditSection';
import { uploadFile, generateReport, generateWordDocument } from '@/lib/api';
import { InterviewAnalysis as InterviewAnalysisType } from '@/lib/types';
import { Download } from 'lucide-react';

export function InterviewAnalysis() {
  const [activeStep, setActiveStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysisData, setAnalysisData] = useState<InterviewAnalysisType | null>(null);
  const [uploadProgress, setUploadProgress] = useState<'uploading' | 'processing' | null>(null);

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
      
      // First, upload the file
      const fileId = await uploadFile(uploadedFile);
      
      setUploadProgress('processing');
      
      // Then, generate the report using the file ID
      const data = await generateReport(fileId);
      
      setAnalysisData(data);
      setActiveStep(2);
      setUploadProgress(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process the interview. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadWord = async () => {
    if (!analysisData) return;

    try {
      const blob = await generateWordDocument(analysisData);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'interview-analysis.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setActiveStep(3);
    } catch (err) {
      setError('Failed to generate document. Please try again.');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Interview Analysis Dashboard</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setActiveStep(Math.max(1, activeStep - 1))}
            disabled={activeStep === 1}
          >
            Previous
          </Button>
          <Button 
            onClick={() => setActiveStep(Math.min(3, activeStep + 1))}
            disabled={activeStep === 3 || !analysisData}
          >
            Next
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-8">
        {[1, 2, 3].map((step) => (
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

          {activeStep === 2 && analysisData && (
            <EditSection 
              data={analysisData}
              onUpdate={setAnalysisData}
            />
          )}

          {activeStep === 3 && (
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