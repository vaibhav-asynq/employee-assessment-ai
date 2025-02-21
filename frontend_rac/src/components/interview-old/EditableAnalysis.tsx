import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { SectionHeading } from './shared/SectionHeading';
import { EditableSubheading } from './shared/EditableSubheading';
import { EditableText } from './shared/EditableText';
import { InterviewAnalysis, OrderedSection, SubheadingSection } from '@/lib/types';

interface EditableAnalysisProps {
  data: InterviewAnalysis;
  onUpdate: (data: InterviewAnalysis) => void;
}

export function EditableAnalysis({ data, onUpdate }: EditableAnalysisProps) {
  const [localData, setLocalData] = useState<InterviewAnalysis>(data);

  // Update parent when local data changes
  useEffect(() => {
    const updateTimeout = setTimeout(() => {
      onUpdate(localData);
    }, 300);

    return () => clearTimeout(updateTimeout);
  }, [localData, onUpdate]);

  // Update local data when parent data changes
  useEffect(() => {
    setLocalData(data);
  }, [data]);

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
              const newHeading = `New Strength ${Object.keys(localData.strengths).length + 1}`;
              setLocalData(prev => ({
                ...prev,
                strengths: {
                  ...prev.strengths,
                  [newHeading]: ''
                }
              }));
            }}
          >
            <Plus className="h-4 w-4 mr-1" /> Add Subheading
          </Button>
        </SectionHeading>
        
        {Object.entries(localData.strengths).map(([heading, content]) => (
          <div key={heading} className="mb-8">
            <EditableSubheading
              value={heading}
              onChange={(newHeading) => {
                const { [heading]: oldContent, ...rest } = localData.strengths;
                setLocalData(prev => ({
                  ...prev,
                  strengths: {
                    ...rest,
                    [newHeading]: oldContent
                  }
                }));
              }}
              onDelete={() => {
                const { [heading]: _, ...rest } = localData.strengths;
                setLocalData(prev => ({
                  ...prev,
                  strengths: rest
                }));
              }}
            />
            <EditableText
              value={content}
              onChange={(newContent) => {
                setLocalData(prev => ({
                  ...prev,
                  strengths: {
                    ...prev.strengths,
                    [heading]: newContent
                  }
                }));
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
              const newHeading = `New Area ${Object.keys(localData.areas_to_target).length + 1}`;
              setLocalData(prev => ({
                ...prev,
                areas_to_target: {
                  ...prev.areas_to_target,
                  [newHeading]: ''
                }
              }));
            }}
          >
            <Plus className="h-4 w-4 mr-1" /> Add Subheading
          </Button>
        </SectionHeading>
        
        {Object.entries(localData.areas_to_target).map(([heading, content]) => (
          <div key={heading} className="mb-8">
            <EditableSubheading
              value={heading}
              onChange={(newHeading) => {
                const { [heading]: oldContent, ...rest } = localData.areas_to_target;
                setLocalData(prev => ({
                  ...prev,
                  areas_to_target: {
                    ...rest,
                    [newHeading]: oldContent
                  }
                }));
              }}
              onDelete={() => {
                const { [heading]: _, ...rest } = localData.areas_to_target;
                setLocalData(prev => ({
                  ...prev,
                  areas_to_target: rest
                }));
              }}
            />
            <EditableText
              value={content}
              onChange={(newContent) => {
                setLocalData(prev => ({
                  ...prev,
                  areas_to_target: {
                    ...prev.areas_to_target,
                    [heading]: newContent
                  }
                }));
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
                setLocalData(prev => ({
                  ...prev,
                  next_steps: [...prev.next_steps, '']
                }));
              }}
            >
              <Plus className="h-4 w-4 mr-1" /> Add Text
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setLocalData(prev => ({
                  ...prev,
                  next_steps: [...prev.next_steps, { main: '', sub_points: [''] }]
                }));
              }}
            >
              <Plus className="h-4 w-4 mr-1" /> Add Points
            </Button>
          </div>
        </SectionHeading>
        
        <div className="space-y-4">
          {localData.next_steps.map((step, index) => (
            <div key={index} className="space-y-2">
              {typeof step === 'string' ? (
                <div className="flex gap-2">
                  <EditableText
                    value={step}
                    onChange={(newValue) => {
                      const newSteps = [...localData.next_steps];
                      newSteps[index] = newValue;
                      setLocalData(prev => ({
                        ...prev,
                        next_steps: newSteps
                      }));
                    }}
                    minHeight="100px"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const newSteps = localData.next_steps.filter((_, i) => i !== index);
                      setLocalData(prev => ({
                        ...prev,
                        next_steps: newSteps
                      }));
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
                        const newSteps = [...localData.next_steps];
                        newSteps[index] = {
                          ...step,
                          main: e.target.value
                        };
                        setLocalData(prev => ({
                          ...prev,
                          next_steps: newSteps
                        }));
                      }}
                      placeholder="Enter heading..."
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const newSteps = localData.next_steps.filter((_, i) => i !== index);
                        setLocalData(prev => ({
                          ...prev,
                          next_steps: newSteps
                        }));
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
                            const newSteps = [...localData.next_steps];
                            const newStep = { ...step };
                            newStep.sub_points = [...step.sub_points];
                            newStep.sub_points[pointIndex] = newValue;
                            newSteps[index] = newStep;
                            setLocalData(prev => ({
                              ...prev,
                              next_steps: newSteps
                            }));
                          }}
                          minHeight="60px"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const newSteps = [...localData.next_steps];
                            const newStep = { ...step };
                            newStep.sub_points = step.sub_points.filter((_, i) => i !== pointIndex);
                            newSteps[index] = newStep;
                            setLocalData(prev => ({
                              ...prev,
                              next_steps: newSteps
                            }));
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
                        const newSteps = [...localData.next_steps];
                        const newStep = { ...step };
                        newStep.sub_points = [...step.sub_points, ''];
                        newSteps[index] = newStep;
                        setLocalData(prev => ({
                          ...prev,
                          next_steps: newSteps
                        }));
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
