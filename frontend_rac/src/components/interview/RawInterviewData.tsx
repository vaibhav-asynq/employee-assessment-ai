import React from 'react';
import { InterviewAnalysis as InterviewAnalysisType } from '@/lib/types';

interface RawInterviewDataProps {
  data: InterviewAnalysisType;
}

export function RawInterviewData({ data }: RawInterviewDataProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Raw Interview Data</h2>
      {/* Add content for raw interview data display here */}
    </div>
  );
}