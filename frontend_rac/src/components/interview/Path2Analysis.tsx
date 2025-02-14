import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { getStrengthEvidences, getDevelopmentAreas, type StrengthEvidences, type DevelopmentAreas, type Evidence } from '@/lib/api';
import { Spinner } from '@/components/ui/spinner';
import { Path2HumanReport } from './Path2HumanReport';
import { InterviewAnalysis as InterviewAnalysisType, NextStepPoint } from '@/lib/types';

export function Path2Analysis() {
  const [strengthEvidences, setStrengthEvidences] = useState<StrengthEvidences | null>(null);
  const [developmentAreas, setDevelopmentAreas] = useState<DevelopmentAreas | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editableData, setEditableData] = useState<InterviewAnalysisType | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [strengthData, developmentData] = await Promise.all([
          getStrengthEvidences(),
          getDevelopmentAreas()
        ]);
        setStrengthEvidences(strengthData);
        setDevelopmentAreas(developmentData);

        // Initialize editable data with empty content but titles from the evidence
        const initialData: InterviewAnalysisType = {
          name: '',
          date: new Date().toISOString(),
          strengths: Object.keys(strengthData.leadershipQualities).reduce((acc: Record<string, string>, key: string) => {
            acc[key] = '';
            return acc;
          }, {}),
          areas_to_target: Object.keys(developmentData.developmentAreas).reduce((acc: Record<string, string>, key: string) => {
            acc[key] = '';
            return acc;
          }, {}),
          next_steps: [
            { main: "", sub_points: [] },
            { main: "", sub_points: [] },
            { main: "", sub_points: [] }
          ]
        };
        setEditableData(initialData);
      } catch (err) {
        setError('Failed to fetch data');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center p-4">
        {error}
      </div>
    );
  }

  const renderEvidence = (evidence: Evidence) => (
    <div key={`${evidence.source}-${evidence.feedback}`} className="mb-4 p-4 bg-gray-50 rounded-lg">
      <p className="text-gray-800 mb-2">{evidence.feedback}</p>
      <div className="text-sm text-gray-600">
        <span className="font-semibold">{evidence.source}</span>
        <span className="mx-2">•</span>
        <span>{evidence.role}</span>
      </div>
    </div>
  );

  const handleUpdate = (updatedData: Partial<InterviewAnalysisType>) => {
    setEditableData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        ...updatedData
      };
    });
  };

  return (
    <div className="grid grid-cols-2 gap-8 h-full">
      {/* Left side - Evidence Display */}
      <div className="h-full overflow-y-auto space-y-8">
        {/* Leadership Qualities Section */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Leadership Qualities</h2>
          <div className="space-y-6">
            {strengthEvidences?.leadershipQualities && Object.entries(strengthEvidences.leadershipQualities).map(([quality, data]) => (
              <Card key={quality} className="p-4">
                <h3 className="text-lg font-semibold mb-4">{quality}</h3>
                <div className="space-y-4">
                  {data.evidence.map((evidence) => renderEvidence(evidence))}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Development Areas Section */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Areas of Development</h2>
          <div className="space-y-6">
            {developmentAreas?.developmentAreas && Object.entries(developmentAreas.developmentAreas).map(([area, data]) => (
              <Card key={area} className="p-4">
                <h3 className="text-lg font-semibold mb-4">{area}</h3>
                <div className="space-y-4">
                  {data.evidence.map((evidence) => renderEvidence(evidence))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Editable Content */}
      <div className="border-l pl-8">
        {editableData && (
          <Path2HumanReport 
            data={editableData}
            onUpdate={handleUpdate}
          />
        )}
      </div>
    </div>
  );
}
