import React from 'react';
import { InterviewAnalysis } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Path4EditableAnalysis } from './Path4EditableAnalysis';

interface Path4HumanReportProps {
  data: InterviewAnalysis;
  onUpdate: (data: Partial<InterviewAnalysis>) => void;
}

export function Path4HumanReport({ data, onUpdate }: Path4HumanReportProps) {
  return (
    <div className="space-y-8">
      <Path4EditableAnalysis data={data} onUpdate={onUpdate} />
      
      {/* Generate Next Steps Button */}
      <div className="mt-8 flex justify-center">
        <Button 
          size="lg"
          onClick={() => {
            console.log('Generate Next Steps clicked');
          }}
        >
          Generate Next Steps
        </Button>
      </div>
    </div>
  );
}
