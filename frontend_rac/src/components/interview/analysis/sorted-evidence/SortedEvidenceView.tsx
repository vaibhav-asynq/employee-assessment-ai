import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Evidence {
  quote: string;
  name: string;
  position: string;
  isStrong?: boolean;
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
  console.log(areasEvidence);
  return (
    <div className="space-y-8">
      {strengthsEvidence && (
        <div>
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Strengths Evidence
          </h2>
          <div className="space-y-4">
            {strengthsEvidence.map((item, index) => {
              let heading = item.heading;
              let act_as_title = false;
              if (
                item.heading.trim().toLowerCase() === "additional strengths"
              ) {
                heading = "Additional Strengths";
                act_as_title = true;
                if (!item.evidence.length) {
                  return null;
                }
              }
              const Component = act_as_title ? "div" : Card;
              return (
                <Component
                  key={index}
                  className={cn(
                    "p-6",
                    act_as_title ? "p-0 m-0 border-none shadow-none" : "",
                  )}
                >
                  <h3
                    className={cn(
                      "mb-6 text-card-foreground text-2xl font-semibold leading-none tracking-tight",
                      act_as_title &&
                        "text-xl font-semibold mb-4 text-gray-800",
                    )}
                  >
                    {heading}
                  </h3>
                  <div className={cn("")}>
                    <ul className="list-disc pl-6 space-y-2">
                      {item.evidence.map((evidence, idx) => (
                        <li
                          key={idx}
                          className={`text-gray-700 ${evidence.isStrong ? "pl-2 border-l-4 border-green-500 bg-green-50" : ""}`}
                        >
                          <div className="mb-1 text-sm font-medium text-gray-500">
                            {evidence.name} - {evidence.position}
                          </div>
                          <div>{evidence.quote}</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Component>
              );
            })}
          </div>
        </div>
      )}

      {areasEvidence && (
        <div>
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Areas to Target Evidence
          </h2>
          <div className="space-y-4">
            {areasEvidence.map((item, index) => {
              let heading = item.heading;
              let act_as_title = false;
              if (item.heading.trim().toLowerCase() === "additional areas") {
                heading = "Additional Areas To Target";
                act_as_title = true;
                if (!item.evidence.length) {
                  return null;
                }
              }
              const Component = act_as_title ? "div" : Card;
              return (
                <Component
                  key={index}
                  className={cn(
                    "p-6",
                    act_as_title ? "p-0 m-0 border-none shadow-none" : "",
                  )}
                >
                  <h3
                    className={cn(
                      "mb-6 text-card-foreground text-2xl font-semibold leading-none tracking-tight",
                      act_as_title &&
                        "text-xl font-semibold mb-4 text-gray-800",
                    )}
                  >
                    {heading}
                  </h3>
                  <div>
                    <ul className="list-disc pl-6 space-y-2">
                      {item.evidence.map((evidence, idx) => (
                        <li
                          key={idx}
                          className={`text-gray-700 ${evidence.isStrong ? "pl-2 border-l-4 border-red-500 bg-red-50" : ""}`}
                        >
                          <div className="mb-1 text-sm font-medium text-gray-500">
                            {evidence.name} - {evidence.position}
                          </div>
                          <div>{evidence.quote}</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Component>
              );
            })}
          </div>
        </div>
      )}

      {adviceEvidence && (
        <div>
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Advice</h2>
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
                          {evidence.name}{" "}
                          {evidence.position && `- ${evidence.position}`}
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
