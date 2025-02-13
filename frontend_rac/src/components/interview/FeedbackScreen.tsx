import React from 'react';

interface FeedbackData {
  strengths: {
    [key: string]: {
      role: string;
      feedback: string[];
    };
  };
  areas_to_target: {
    [key: string]: {
      role: string;
      feedback: string[];
    };
  };
}

interface FeedbackScreenProps {
  data: FeedbackData;
}

export function FeedbackScreen({ data }: FeedbackScreenProps) {
  return (
    <div className="pr-4 max-h-[80vh] overflow-y-auto">
      <div className="space-y-16 pb-8">
        {/* Strengths */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold mb-6 text-green-700 sticky top-0 bg-white py-4">Strengths</h2>
          <div className="space-y-8">
            {Object.entries(data.strengths).map(([name, info]) => (
              <div key={name} className="border-b pb-6">
                <h3 className="text-xl font-semibold">{name.replace(/_/g, ' ')}</h3>
                <p className="text-gray-600 italic mb-3">{info.role}</p>
                <ul className="list-disc pl-5 space-y-2">
                  {info.feedback.map((point, index) => (
                    <li key={index} className="text-gray-800">{point}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Areas to Target */}
        <div className="space-y-6 border-t pt-8">
          <h2 className="text-2xl font-bold mb-6 text-red-700 sticky top-0 bg-white py-4">Areas to Target</h2>
          <div className="space-y-8">
            {Object.entries(data.areas_to_target).map(([name, info]) => (
              <div key={name} className="border-b pb-6">
                <h3 className="text-xl font-semibold">{name.replace(/_/g, ' ')}</h3>
                <p className="text-gray-600 italic mb-3">{info.role}</p>
                <ul className="list-disc pl-5 space-y-2">
                  {info.feedback.map((point, index) => (
                    <li key={index} className="text-gray-800">{point}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
