import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Evidence {
  quote: string;
  name: string;
  position: string;
}

interface SortedEvidence {
  heading: string;
  evidence: Evidence[];
}

interface SortedEvidenceViewProps {
  strengthsEvidence?: SortedEvidence[];
  areasEvidence?: SortedEvidence[];
  adviceEvidence?: SortedEvidence[];
}

export function SortedEvidenceView({
  strengthsEvidence,
  areasEvidence,
  adviceEvidence,
}: SortedEvidenceViewProps) {
  return (
    <div className="space-y-8">
      {strengthsEvidence && (
        <div>
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Strengths Evidence
          </h2>
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
                        <div className="mb-1 text-sm font-medium text-gray-500">
                          {evidence.name} - {evidence.position}
                        </div>
                        <div>{evidence.quote}</div>
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
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Areas to Target Evidence
          </h2>
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
                        <div className="mb-1 text-sm font-medium text-gray-500">
                          {evidence.name} - {evidence.position}
                        </div>
                        <div>{evidence.quote}</div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {adviceEvidence && (
        <div>
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Advice
          </h2>
          <div className="space-y-4">
            {adviceEvidence.map((item, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle>{item.heading}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc pl-6 space-y-2">
                    {item.evidence.map((evidence, idx) => (
                      <li key={idx} className="text-gray-700">
                        <div className="mb-1 text-sm font-medium text-gray-500">
                          {evidence.name} {evidence.position && `- ${evidence.position}`}
                        </div>
                        <div>{evidence.quote}</div>
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
