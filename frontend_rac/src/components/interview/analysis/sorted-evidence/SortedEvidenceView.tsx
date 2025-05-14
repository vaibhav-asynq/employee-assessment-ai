import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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
  return (
    <div className="space-y-8">
      {strengthsEvidence && (
        <div>
          <h2 className="text-xl font-semibold mb-4 text-emerald-600">
            Strengths Evidence
          </h2>
          <div className="space-y-4">
            <Accordion type="multiple">
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

                if (act_as_title) {
                  return (
                    <AccordionItem value={`strength-${index}`} key={index}>
                      <div key={index} className="mt-6">
                        <AccordionTrigger className="text-base py-4">
                          <div className="select-text text-left">
                            <h3 className="text-xl font-semibold mb-4 text-gray-800">
                              {heading}
                            </h3>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="text-base pt-2">
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
                        </AccordionContent>
                      </div>
                    </AccordionItem>
                  );
                }

                return (
                  <AccordionItem value={`strength-${index}`} key={index}>
                    <div className="border-b pb-2">
                      <AccordionTrigger className="text-base py-4">
                        <div className="select-text text-left">
                          <h3 className="font-semibold text-lg">{heading}</h3>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="text-base pt-2">
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
                      </AccordionContent>
                    </div>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </div>
        </div>
      )}

      {areasEvidence && (
        <div>
          <h2 className="text-xl font-semibold mb-4 text-amber-600">
            Areas to Target Evidence
          </h2>
          <div className="space-y-4">
            <Accordion type="multiple">
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

                if (act_as_title) {
                  return (
                    <AccordionItem value={`area-${index}`} key={index}>
                      <div key={index} className="mt-6">
                        <div className="border-b pb-2">
                          <AccordionTrigger className="text-base py-4">
                            <h3 className="text-xl font-semibold mb-4 text-gray-800">
                              {heading}
                            </h3>
                          </AccordionTrigger>
                          <AccordionContent className="text-base pt-2">
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
                          </AccordionContent>
                        </div>
                      </div>
                    </AccordionItem>
                  );
                }

                return (
                  <AccordionItem value={`area-${index}`} key={index}>
                    <div className="border-b pb-2">
                      <AccordionTrigger className="text-base py-4">
                        <div className="select-text text-left">
                          <h3 className="font-semibold text-lg">{heading}</h3>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="text-base pt-2">
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
                      </AccordionContent>
                    </div>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </div>
        </div>
      )}

      {adviceEvidence && (
        <div>
          <h2 className="text-xl font-semibold mb-4 text-indigo-600">Advice</h2>
          <div className="space-y-4">
            <Accordion type="multiple">
              {adviceEvidence.map((item, index) => (
                <AccordionItem value={`advice-${index}`} key={index}>
                  <div className="border-b pb-2">
                    <AccordionTrigger className="text-base py-4">
                      <div className="select-text text-left">
                        <h3 className="font-semibold text-lg">
                          {item.heading}
                        </h3>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-base pt-2">
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
                    </AccordionContent>
                  </div>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      )}
    </div>
  );
}
