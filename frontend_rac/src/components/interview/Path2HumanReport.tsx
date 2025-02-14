import React, { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { EditableSubheading } from './shared/EditableSubheading';
import { EditableText } from './shared/EditableText';
import { SectionHeading } from './shared/SectionHeading';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { InterviewAnalysis, NextStep, NextStepPoint } from '@/lib/types';

interface Path2HumanReportProps {
  data: InterviewAnalysis;
  onUpdate: (data: Partial<InterviewAnalysis>) => void;
}

interface LocalSection {
  id: string;
  heading: string;
  content: string;
}

export function Path2HumanReport({ data, onUpdate }: Path2HumanReportProps) {
  const [sections, setSections] = useState({
    strengths: Object.entries(data.strengths).map(([heading, content]) => ({
      id: `strength-${heading}`,
      heading,
      content
    })),
    areas: Object.entries(data.areas_to_target).map(([heading, content]) => ({
      id: `area-${heading}`,
      heading,
      content
    }))
  });

  const updateParentState = useCallback(() => {
    onUpdate({
      strengths: Object.fromEntries(
        sections.strengths.map(s => [s.heading, s.content])
      ),
      areas_to_target: Object.fromEntries(
        sections.areas.map(a => [a.heading, a.content])
      )
    });
  }, [sections, onUpdate]);

  const addTextStep = () => {
    const newSteps = [...data.next_steps, ""];
    onUpdate({ next_steps: newSteps });
  };

  const addPointsStep = () => {
    const newStep: NextStepPoint = {
      main: "",
      sub_points: []
    };
    const newSteps = [...data.next_steps, newStep];
    onUpdate({ next_steps: newSteps });
  };

  const updateStep = (index: number, content: string | NextStepPoint) => {
    const newSteps = [...data.next_steps];
    newSteps[index] = content;
    onUpdate({ next_steps: newSteps });
  };

  const deleteStep = (index: number) => {
    const newSteps = data.next_steps.filter((_, i) => i !== index);
    onUpdate({ next_steps: newSteps });
  };

  const addSubPoint = (stepIndex: number) => {
    const step = data.next_steps[stepIndex] as NextStepPoint;
    if (step && 'sub_points' in step) {
      const newStep = {
        ...step,
        sub_points: [...step.sub_points, ""]
      };
      const newSteps = [...data.next_steps];
      newSteps[stepIndex] = newStep;
      onUpdate({ next_steps: newSteps });
    }
  };

  const updateSubPoint = (stepIndex: number, pointIndex: number, content: string) => {
    const step = data.next_steps[stepIndex] as NextStepPoint;
    if (step && 'sub_points' in step) {
      const newSubPoints = [...step.sub_points];
      newSubPoints[pointIndex] = content;
      const newStep = {
        ...step,
        sub_points: newSubPoints
      };
      const newSteps = [...data.next_steps];
      newSteps[stepIndex] = newStep;
      onUpdate({ next_steps: newSteps });
    }
  };

  const deleteSubPoint = (stepIndex: number, pointIndex: number) => {
    const step = data.next_steps[stepIndex] as NextStepPoint;
    if (step && 'sub_points' in step) {
      const newSubPoints = step.sub_points.filter((_, i) => i !== pointIndex);
      const newStep = {
        ...step,
        sub_points: newSubPoints
      };
      const newSteps = [...data.next_steps];
      newSteps[stepIndex] = newStep;
      onUpdate({ next_steps: newSteps });
    }
  };

  return (
    <div className="space-y-8">
      {/* Strengths Section */}
      <section className="mb-8">
        <SectionHeading title="Leadership Qualities" className="text-xl font-semibold text-gray-900">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              const newHeading = `New Strength ${sections.strengths.length + 1}`;
              setSections(prev => ({
                ...prev,
                strengths: [...prev.strengths, {
                  id: `strength-${newHeading}`,
                  heading: newHeading,
                  content: ''
                }]
              }));
              setTimeout(updateParentState, 0);
            }}
          >
            <Plus className="h-4 w-4 mr-1" /> Add Subheading
          </Button>
        </SectionHeading>
        
        <div className="space-y-6">
          {sections.strengths.map((strength) => (
            <Card key={strength.id} className="p-4">
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
              <div className="mt-2">
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
                  placeholder="Enter content here..."
                />
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Areas to Target Section */}
      <section className="mb-8">
        <SectionHeading title="Areas of Development" className="text-xl font-semibold text-gray-900">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              const newHeading = `New Area ${sections.areas.length + 1}`;
              setSections(prev => ({
                ...prev,
                areas: [...prev.areas, {
                  id: `area-${newHeading}`,
                  heading: newHeading,
                  content: ''
                }]
              }));
              setTimeout(updateParentState, 0);
            }}
          >
            <Plus className="h-4 w-4 mr-1" /> Add Subheading
          </Button>
        </SectionHeading>
        
        <div className="space-y-6">
          {sections.areas.map((area) => (
            <Card key={area.id} className="p-4">
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
              <div className="mt-2">
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
                  placeholder="Enter content here..."
                />
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Next Steps Section */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Next Steps</h2>
          <div className="space-x-2">
            <Button variant="outline" size="sm" onClick={addTextStep}>
              <Plus className="h-4 w-4 mr-1" /> Add Text
            </Button>
            <Button variant="outline" size="sm" onClick={addPointsStep}>
              <Plus className="h-4 w-4 mr-1" /> Add Points
            </Button>
          </div>
        </div>
        <div className="space-y-4">
          {data.next_steps.map((step, index) => (
            <Card key={index} className="p-4 relative">
              {typeof step === 'string' ? (
                // Text step
                <div>
                  <EditableText
                    value={step}
                    onChange={(content) => updateStep(index, content)}
                    placeholder="Enter text..."
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => deleteStep(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                // Points step
                <div>
                  <EditableText
                    value={step.main}
                    onChange={(content) => updateStep(index, { ...step, main: content })}
                    placeholder="Enter main point..."
                  />
                  <div className="ml-6 mt-2 space-y-2">
                    {step.sub_points.map((subPoint, subIndex) => (
                      <div key={subIndex} className="flex items-start gap-2">
                        <EditableText
                          value={subPoint}
                          onChange={(content) => updateSubPoint(index, subIndex, content)}
                          placeholder="Enter sub-point..."
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteSubPoint(index, subIndex)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => addSubPoint(index)}
                      className="mt-2"
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add Sub-point
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => deleteStep(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
