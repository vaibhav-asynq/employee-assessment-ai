import React, { useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { getStrengthEvidences, getDevelopmentAreas, type StrengthEvidences, type DevelopmentAreas, type Evidence } from '@/lib/api';
import { Spinner } from '@/components/ui/spinner';
import { Path2HumanReport } from './Path2HumanReport';
import { InterviewAnalysis as InterviewAnalysisType } from '@/lib/types';
import { usePath2Context } from './context/Path2Context';

function Path2AnalysisContent() {
  const { editableData, setEditableData } = usePath2Context();
  const [strengthEvidences, setStrengthEvidences] = React.useState<StrengthEvidences | null>(null);
  const [developmentAreas, setDevelopmentAreas] = React.useState<DevelopmentAreas | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [strengthData, developmentData] = await Promise.all([
          getStrengthEvidences(),
          getDevelopmentAreas()
        ]);
        setStrengthEvidences(strengthData);
        setDevelopmentAreas(developmentData);

        // Only initialize if editableData doesn't exist
        if (!editableData) {
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
        }
      } catch (err) {
        setError('Failed to fetch data');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [editableData, setEditableData]);

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


  return loading ? (
    <div className="flex justify-center items-center h-full">
      <Spinner />
    </div>
  ) : error ? (
    <div className="text-red-500 text-center p-4">
      {error}
    </div>
  ) : (
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
          <Path2HumanReport />
        )}
      </div>
    </div>
  );
}

export function Path2Analysis() {
  return <Path2AnalysisContent />;
}
