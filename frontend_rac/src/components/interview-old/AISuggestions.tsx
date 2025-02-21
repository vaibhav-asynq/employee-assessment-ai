import React from 'react';
import { InterviewAnalysis } from '@/lib/types';

interface AISuggestionsProps {
  data: InterviewAnalysis;
}

export function AISuggestions({ data }: AISuggestionsProps) {
  return (
    <div className="pr-4">
      <div className="space-y-8">
        {/* Strengths */}
        <div>
          <h3 className="text-xl font-semibold mb-4">Strengths</h3>
          <div className="space-y-6">
            {Object.entries(data.strengths).map(([title, content]) => (
              <div key={title} className="mb-6">
                <h4 className="font-semibold mb-2">{title}</h4>
                <div className="text-gray-800 whitespace-pre-wrap">{content}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Areas to Target */}
        <div>
          <h3 className="text-xl font-semibold mb-4">Areas to Target</h3>
          <div className="space-y-6">
            {Object.entries(data.areas_to_target).map(([title, content]) => (
              <div key={title} className="mb-6">
                <h4 className="font-semibold mb-2">{title}</h4>
                <div className="text-gray-800 whitespace-pre-wrap">{content}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Next Steps */}
        <div>
          <h3 className="text-xl font-semibold mb-4">Next Steps</h3>
          <div className="space-y-6">
            {data.next_steps.map((step, index) => (
              <div key={index} className="mb-6">
                {typeof step === 'string' ? (
                  <div className="text-gray-800 whitespace-pre-wrap">{step}</div>
                ) : (
                  <div>
                    <h4 className="font-semibold mb-2">{step.main}</h4>
                    <ul className="list-disc pl-5 space-y-2">
                      {step.sub_points.map((point, pointIndex) => (
                        <li key={pointIndex} className="text-gray-800">{point}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
