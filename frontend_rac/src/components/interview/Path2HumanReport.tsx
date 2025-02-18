import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { EditableSubheading } from './shared/EditableSubheading';
import { EditableText } from './shared/EditableText';
import { SectionHeading } from './shared/SectionHeading';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { InterviewAnalysis, NextStepPoint } from '@/lib/types';
import { usePath2Context } from './context/Path2Context';

interface LocalSection {
  id: string;
  heading: string;
  content: string;
}

export function Path2HumanReport() {
  const { editableData: data, updateData } = usePath2Context();
  const [sections, setSections] = useState<{
    strengths: LocalSection[];
    areas: LocalSection[];
  }>(() => ({
    strengths: Object.entries(data?.strengths || {}).map(([heading, content]) => ({
      id: `strength-${heading}`,
      heading,
      content
    })),
    areas: Object.entries(data?.areas_to_target || {}).map(([heading, content]) => ({
      id: `area-${heading}`,
      heading,
      content
    }))
  }));

  // Update local sections when context data changes
  useEffect(() => {
    if (data) {
      const newSections = {
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
      };
      console.log('Updating sections from data:', newSections);
      setSections(newSections);
    }
  }, [data]);

  const updateParentState = useCallback(() => {
    if (!data) return;
    
    // Create a new object with only the fields we want to update
    const updates = {
      strengths: Object.fromEntries(
        sections.strengths.map(s => [s.heading, s.content])
      ),
      areas_to_target: Object.fromEntries(
        sections.areas.map(a => [a.heading, a.content])
      )
    };
    
    console.log('Updating with:', updates);
    updateData(updates);
  }, [data, sections, updateData]);

  // Debounce the update to prevent rapid state changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (data) {
        updateParentState();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [sections, data, updateParentState]);

  if (!data) {
    return null;
  }

  const addTextStep = useCallback(() => {
    if (!data) return;
    const newSteps = [...data.next_steps, ""];
    updateData({ ...data, next_steps: newSteps });
  }, [data, updateData]);

  const addPointsStep = useCallback(() => {
    if (!data) return;
    const newStep: NextStepPoint = {
      main: "",
      sub_points: []
    };
    const newSteps = [...data.next_steps, newStep];
    updateData({ ...data, next_steps: newSteps });
  }, [data, updateData]);

  const updateStep = useCallback((index: number, content: string | NextStepPoint) => {
    if (!data) return;
    const newSteps = [...data.next_steps];
    newSteps[index] = content;
    updateData({ ...data, next_steps: newSteps });
  }, [data, updateData]);

  const deleteStep = useCallback((index: number) => {
    if (!data) return;
    const newSteps = data.next_steps.filter((_, i) => i !== index);
    updateData({ ...data, next_steps: newSteps });
  }, [data, updateData]);

  const addSubPoint = useCallback((stepIndex: number) => {
    if (!data) return;
    const step = data.next_steps[stepIndex] as NextStepPoint;
    if (step && 'sub_points' in step) {
      const newStep = {
        ...step,
        sub_points: [...step.sub_points, ""]
      };
      const newSteps = [...data.next_steps];
      newSteps[stepIndex] = newStep;
      updateData({ ...data, next_steps: newSteps });
    }
  }, [data, updateData]);

  const updateSubPoint = useCallback((stepIndex: number, pointIndex: number, content: string) => {
    if (!data) return;
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
      updateData({ ...data, next_steps: newSteps });
    }
  }, [data, updateData]);

  const deleteSubPoint = useCallback((stepIndex: number, pointIndex: number) => {
    if (!data) return;
    const step = data.next_steps[stepIndex] as NextStepPoint;
    if (step && 'sub_points' in step) {
      const newSubPoints = step.sub_points.filter((_, i) => i !== pointIndex);
      const newStep = {
        ...step,
        sub_points: newSubPoints
      };
      const newSteps = [...data.next_steps];
      newSteps[stepIndex] = newStep;
      updateData({ ...data, next_steps: newSteps });
    }
  }, [data, updateData]);

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
                }}
                onDelete={() => {
                  setSections(prev => ({
                    ...prev,
                    strengths: prev.strengths.filter(s => s.id !== strength.id)
                  }));
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
                }}
                onDelete={() => {
                  setSections(prev => ({
                    ...prev,
                    areas: prev.areas.filter(a => a.id !== area.id)
                  }));
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
