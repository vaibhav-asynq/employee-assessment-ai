"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import {
  getStrengthEvidences,
  getDevelopmentAreas,
  type StrengthEvidences,
  type DevelopmentAreas,
  type Evidence,
} from "@/lib/api";
import { Spinner } from "@/components/ui/spinner";
import { Path2HumanReport } from "./Path2HumanReport";
import { templatesIds } from "@/lib/types";
import { useInterviewAnalysis } from "@/components/providers/InterviewAnalysisContext";

export function AiCompetencies() {
  const { activeTemplateId, templates, setActiveTemplate, addTemplate } =
    useInterviewAnalysis();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [strengthEvidences, setStrengthEvidences] =
    useState<StrengthEvidences | null>(null);
  const [developmentAreas, setDevelopmentAreas] =
    useState<DevelopmentAreas | null>(null);

  const templateId = templatesIds.coachParagraph;
  const fetchDataRef = useRef(false);

  useEffect(() => {
    if (fetchDataRef.current) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [strengthData, developmentData] = await Promise.all([
          getStrengthEvidences(),
          getDevelopmentAreas(),
        ]);
        setStrengthEvidences(strengthData);
        setDevelopmentAreas(developmentData);

        if (templates[templateId]) {
          if (activeTemplateId !== templateId) {
            setActiveTemplate(templateId);
          }
        } else {
          // INFO: update only if no data preset
          // Create the template on the fly
          addTemplate(templateId, {
            name: "",
            date: new Date().toISOString(),
            strengths: Object.keys(strengthData.leadershipQualities).reduce(
              (acc: Record<string, string>, key: string) => {
                acc[key] = "";
                return acc;
              },
              {},
            ),
            areas_to_target: Object.keys(
              developmentData.developmentAreas,
            ).reduce((acc: Record<string, string>, key: string) => {
              acc[key] = "";
              return acc;
            }, {}),
            next_steps: [
              { main: "", sub_points: [] },
              { main: "", sub_points: [] },
              { main: "", sub_points: [] },
            ],
          });
        }
        // Mark the fetch as completed
        fetchDataRef.current = true;
      } catch (err) {
        setError("Failed to fetch data");
        console.error("Error fetching data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [activeTemplateId, addTemplate, setActiveTemplate, templateId, templates]);

  const renderEvidence = useCallback(
    (evidence: Evidence) => (
      <div
        key={`${evidence.source}-${evidence.feedback}`}
        className="mb-4 p-4 bg-gray-50 rounded-lg"
      >
        <p className="text-gray-800 mb-2">{evidence.feedback}</p>
        <div className="text-sm text-gray-600">
          <span className="font-semibold">{evidence.source}</span>
          <span className="mx-2">•</span>
          <span>{evidence.role}</span>
        </div>
      </div>
    ),
    [],
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">{error}</div>;
  }

  return (
    <div className="grid grid-cols-2 gap-8 h-full">
      {/* Left side - Evidence Display */}
      <div className="h-full overflow-y-auto space-y-8">
        {strengthEvidences && developmentAreas && (
          <>
            {/* Leadership Qualities Section */}
            <div>
              <h2 className="text-2xl font-bold mb-6">Leadership Qualities</h2>
              <div className="space-y-6">
                {Object.entries(strengthEvidences.leadershipQualities).map(
                  ([quality, data]) => (
                    <Card key={quality} className="p-4">
                      <h3 className="text-lg font-semibold mb-4">{quality}</h3>
                      <div className="space-y-4">
                        {data.evidence.map(renderEvidence)}
                      </div>
                    </Card>
                  ),
                )}
              </div>
            </div>

            {/* Development Areas Section */}
            <div>
              <h2 className="text-2xl font-bold mb-6">Areas of Development</h2>
              <div className="space-y-6">
                {Object.entries(developmentAreas.developmentAreas).map(
                  ([area, data]) => (
                    <Card key={area} className="p-4">
                      <h3 className="text-lg font-semibold mb-4">{area}</h3>
                      <div className="space-y-4">
                        {data.evidence.map(renderEvidence)}
                      </div>
                    </Card>
                  ),
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Right side - Editable Content */}
      <div className="border-l pl-8">{<Path2HumanReport />}</div>
    </div>
  );
}
