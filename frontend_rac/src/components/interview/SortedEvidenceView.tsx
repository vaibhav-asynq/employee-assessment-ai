import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SortedEvidence {
  heading: string;
  evidence: string[];
}

interface SortedEvidenceViewProps {
  strengthsEvidence?: SortedEvidence[];
  areasEvidence?: SortedEvidence[];
  selectedSection: 'strengths' | 'areas' | null;
}

export function SortedEvidenceView({ 
  strengthsEvidence, 
  areasEvidence
}: SortedEvidenceViewProps) {
  return (
    <div className="space-y-8 p-6">
      {strengthsEvidence && (
        <div>
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Strengths Evidence</h2>
          <div className="space-y-4">
            {strengthsEvidence.map((item, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle>{item.heading}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc pl-6 space-y-2">
                    {item.evidence.map((evidence, idx) => (
                      <li key={idx} className="text-gray-700">
                        {evidence}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {areasEvidence && (
        <div>
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Areas to Target Evidence</h2>
          <div className="space-y-4">
            {areasEvidence.map((item, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle>{item.heading}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc pl-6 space-y-2">
                    {item.evidence.map((evidence, idx) => (
                      <li key={idx} className="text-gray-700">
                        {evidence}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
