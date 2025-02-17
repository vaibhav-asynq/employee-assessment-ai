import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Sparkles } from 'lucide-react';
import { generateStrengthContent, generateAreaContent, generateNextSteps } from '@/lib/api';
import { SectionHeading } from './shared/SectionHeading';
import { EditableSubheading } from './shared/EditableSubheading';
import { EditableText } from './shared/EditableText';
import { InterviewAnalysis } from '@/lib/types';

interface EditableAnalysisProps {
  data: InterviewAnalysis;
  onUpdate: (data: InterviewAnalysis) => void;
  fileId: string | null;
  onStrengthsComplete?: (complete: boolean) => void;
  onAreasComplete?: (complete: boolean) => void;
}

interface LocalSection {
  id: string;
  heading: string;
  content: string;
}

export function Path3EditableAnalysis({ 
  data, 
  onUpdate, 
  fileId,
  onStrengthsComplete,
  onAreasComplete 
}: EditableAnalysisProps) {
  const [loadingStrength, setLoadingStrength] = useState<string | null>(null);
  const [loadingArea, setLoadingArea] = useState<string | null>(null);
  const [loadingNextSteps, setLoadingNextSteps] = useState(false);

  // Initialize sections with stable IDs
  const [sections, setSections] = useState({
    strengths: [
      { id: 'strength-1', heading: 'Strength 1', content: '' },
      { id: 'strength-2', heading: 'Strength 2', content: '' },
      { id: 'strength-3', heading: 'Strength 3', content: '' }
      // { id: 'strength-4', heading: 'Strength 4', content: '' },
      // { id: 'strength-5', heading: 'Strength 5', content: '' }
    ],
    areas: [
      { id: 'area-1', heading: 'Development Area 1', content: '' },
      { id: 'area-2', heading: 'Development Area 2', content: '' },
      { id: 'area-3', heading: 'Development Area 3', content: '' },
      { id: 'area-4', heading: 'Development Area 4', content: '' }
      // { id: 'area-5', heading: 'Development Area 5', content: '' }
    ]
  });

  const checkSectionCompletion = useCallback(() => {
    const strengthsComplete = sections.strengths.every(s => {
      const defaultPattern = /^Strength \d+$/;
      return !defaultPattern.test(s.heading);
    });
    
    const areasComplete = sections.areas.every(a => {
      const defaultPattern = /^Development Area \d+$/;
      return !defaultPattern.test(a.heading);
    });
    
    onStrengthsComplete?.(strengthsComplete);
    onAreasComplete?.(areasComplete);
  }, [sections, onStrengthsComplete, onAreasComplete]);

  const updateParentState = useCallback(() => {
    const analysisData: InterviewAnalysis = {
      ...data,
      strengths: Object.fromEntries(
        sections.strengths.map(s => [s.heading, s.content])
      ),
      areas_to_target: Object.fromEntries(
        sections.areas.map(a => [a.heading, a.content])
      )
    };
    onUpdate(analysisData);
    checkSectionCompletion();
  }, [sections, data, onUpdate, checkSectionCompletion]);

  // Check completion on mount and when sections change
  React.useEffect(() => {
    checkSectionCompletion();
  }, [sections, checkSectionCompletion]);

  const handleGenerateStrength = async (heading: string) => {
    if (!fileId) {
      console.error('No file ID found');
      return;
    }

    try {
      setLoadingStrength(heading);
      const content = await generateStrengthContent(heading, fileId);
      setSections(prev => ({
        ...prev,
        strengths: prev.strengths.map(s => 
          s.heading === heading 
            ? { ...s, content }
            : s
        )
      }));
      setTimeout(updateParentState, 0);
    } catch (error) {
      console.error('Error generating strength content:', error);
    } finally {
      setLoadingStrength(null);
    }
  };

  const handleGenerateArea = async (heading: string) => {
    if (!fileId) {
      console.error('No file ID found');
      return;
    }

    try {
      setLoadingArea(heading);
      const content = await generateAreaContent(heading, fileId);
      setSections(prev => ({
        ...prev,
        areas: prev.areas.map(a => 
          a.heading === heading 
            ? { ...a, content }
            : a
        )
      }));
      setTimeout(updateParentState, 0);
    } catch (error) {
      console.error('Error generating area content:', error);
    } finally {
      setLoadingArea(null);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold tracking-tight mb-8">AI Suggestions</h2>

      {/* Strengths Section */}
      <section className="mb-8">
        <SectionHeading title="STRENGTHS" className="text-xl font-semibold text-gray-900">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setSections(prev => ({
                ...prev,
                strengths: [
                  ...prev.strengths,
                  {
                    id: `strength-${prev.strengths.length + 1}`,
                    heading: `Strength ${prev.strengths.length + 1}`,
                    content: ''
                  }
                ]
              }));
              setTimeout(updateParentState, 0);
            }}
          >
            <Plus className="h-4 w-4 mr-1" /> Add Subheading
          </Button>
        </SectionHeading>
        
        {sections.strengths.map((strength) => (
          <div key={strength.id} className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-1">
                <EditableSubheading
                  value={strength.heading}
                  onChange={(newHeading) => {
                    setSections(prev => ({
                      ...prev,
                      strengths: prev.strengths.map(s => 
                        s.id === strength.id 
                          ? { ...s, heading: newHeading }
                          : s
                      )
                    }));
                    setTimeout(updateParentState, 0);
                  }}
                  onDelete={() => {
                    setSections(prev => ({
                      ...prev,
                      strengths: prev.strengths.filter(s => s.id !== strength.id)
                    }));
                    setTimeout(updateParentState, 0);
                  }}
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleGenerateStrength(strength.heading)}
                disabled={loadingStrength === strength.heading}
                className="text-gray-500 whitespace-nowrap flex items-center"
              >
                {loadingStrength === strength.heading ? (
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                Generate with AI
              </Button>
            </div>
            <EditableText
              value={strength.content}
              onChange={(newContent) => {
                setSections(prev => ({
                  ...prev,
                  strengths: prev.strengths.map(s => 
                    s.id === strength.id 
                      ? { ...s, content: newContent }
                      : s
                  )
                }));
                setTimeout(updateParentState, 0);
              }}
              minHeight="180px"
            />
          </div>
        ))}
      </section>

      {/* Areas to Target Section */}
      <section className="mb-8">
        <SectionHeading title="AREAS TO TARGET" className="text-xl font-semibold text-gray-900">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setSections(prev => ({
                ...prev,
                areas: [
                  ...prev.areas,
                  {
                    id: `area-${prev.areas.length + 1}`,
                    heading: `Development Area ${prev.areas.length + 1}`,
                    content: ''
                  }
                ]
              }));
              setTimeout(updateParentState, 0);
            }}
          >
            <Plus className="h-4 w-4 mr-1" /> Add Subheading
          </Button>
        </SectionHeading>
        
        {sections.areas.map((area) => (
          <div key={area.id} className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-1">
                <EditableSubheading
                  value={area.heading}
                  onChange={(newHeading) => {
                    setSections(prev => ({
                      ...prev,
                      areas: prev.areas.map(a => 
                        a.id === area.id 
                          ? { ...a, heading: newHeading }
                          : a
                      )
                    }));
                    setTimeout(updateParentState, 0);
                  }}
                  onDelete={() => {
                    setSections(prev => ({
                      ...prev,
                      areas: prev.areas.filter(a => a.id !== area.id)
                    }));
                    setTimeout(updateParentState, 0);
                  }}
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleGenerateArea(area.heading)}
                disabled={loadingArea === area.heading}
                className="text-gray-500 whitespace-nowrap flex items-center"
              >
                {loadingArea === area.heading ? (
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                Generate with AI
              </Button>
            </div>
            <EditableText
              value={area.content}
              onChange={(newContent) => {
                setSections(prev => ({
                  ...prev,
                  areas: prev.areas.map(a => 
                    a.id === area.id 
                      ? { ...a, content: newContent }
                      : a
                  )
                }));
                setTimeout(updateParentState, 0);
              }}
              minHeight="180px"
            />
          </div>
        ))}
      </section>

      {/* Next Steps Section */}
      <section className="mb-8">
        <SectionHeading title="NEXT STEPS" className="text-xl font-semibold text-gray-900">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                onUpdate({
                  ...data,
                  next_steps: [...data.next_steps, '']
                });
              }}
            >
              <Plus className="h-4 w-4 mr-1" /> Add Text
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                onUpdate({
                  ...data,
                  next_steps: [...data.next_steps, { main: '', sub_points: [''] }]
                });
              }}
            >
              <Plus className="h-4 w-4 mr-1" /> Add Points
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                if (!fileId) {
                  console.error('No file ID found');
                  return;
                }

                try {
                  setLoadingNextSteps(true);
                  const nextSteps = await generateNextSteps(
                    Object.fromEntries(
                      Object.values(sections.areas).map(area => [area.heading, area.content])
                    ),
                    fileId
                  );
                  onUpdate({
                    ...data,
                    next_steps: nextSteps
                  });
                } catch (error) {
                  console.error('Error generating next steps:', error);
                } finally {
                  setLoadingNextSteps(false);
                }
              }}
              disabled={loadingNextSteps}
              className="text-gray-500 whitespace-nowrap flex items-center"
            >
              {loadingNextSteps ? (
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Generate with AI
            </Button>
          </div>
        </SectionHeading>
        
        <div className="space-y-4">
          {data.next_steps.map((step, index) => (
            <div key={index} className="space-y-2">
              {typeof step === 'string' ? (
                <div className="flex gap-2">
                  <EditableText
                    value={step}
                    onChange={(newValue) => {
                      const newSteps = [...data.next_steps];
                      newSteps[index] = newValue;
                      onUpdate({
                        ...data,
                        next_steps: newSteps
                      });
                    }}
                    minHeight="100px"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const newSteps = data.next_steps.filter((_, i) => i !== index);
                      onUpdate({
                        ...data,
                        next_steps: newSteps
                      });
                    }}
                    className="text-gray-500 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2 w-full">
                    <input
                      type="text"
                      className="flex-1 p-2 border rounded text-lg font-semibold min-w-[500px]"
                      value={step.main}
                      onChange={(e) => {
                        const newSteps = [...data.next_steps];
                        newSteps[index] = {
                          ...step,
                          main: e.target.value
                        };
                        onUpdate({
                          ...data,
                          next_steps: newSteps
                        });
                      }}
                      placeholder="Enter heading..."
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const newSteps = data.next_steps.filter((_, i) => i !== index);
                        onUpdate({
                          ...data,
                          next_steps: newSteps
                        });
                      }}
                      className="text-gray-500 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="ml-6 space-y-2">
                    {step.sub_points.map((point, pointIndex) => (
                      <div key={pointIndex} className="flex gap-2">
                        <EditableText
                          value={point}
                          onChange={(newValue) => {
                            const newSteps = [...data.next_steps];
                            const newStep = { ...step };
                            newStep.sub_points = [...step.sub_points];
                            newStep.sub_points[pointIndex] = newValue;
                            newSteps[index] = newStep;
                            onUpdate({
                              ...data,
                              next_steps: newSteps
                            });
                          }}
                          minHeight="60px"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const newSteps = [...data.next_steps];
                            const newStep = { ...step };
                            newStep.sub_points = step.sub_points.filter((_, i) => i !== pointIndex);
                            newSteps[index] = newStep;
                            onUpdate({
                              ...data,
                              next_steps: newSteps
                            });
                          }}
                          className="text-gray-500 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newSteps = [...data.next_steps];
                        const newStep = { ...step };
                        newStep.sub_points = [...step.sub_points, ''];
                        newSteps[index] = newStep;
                        onUpdate({
                          ...data,
                          next_steps: newSteps
                        });
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add Sub-point
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
