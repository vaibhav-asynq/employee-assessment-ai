import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { SectionHeading } from './shared/SectionHeading';
import { EditableSubheading } from './shared/EditableSubheading';
import { EditableText } from './shared/EditableText';
import { InterviewAnalysis } from '@/lib/types';

interface EditableAnalysisProps {
  data: InterviewAnalysis;
  onUpdate: (data: InterviewAnalysis) => void;
}

export function EditableAnalysis({ data, onUpdate }: EditableAnalysisProps) {
  // Convert strengths object to array structure
  const strengthsArray = Object.entries(data.strengths).map(([heading, content]) => ({
    main: heading,
    content: content
  }));

  // Convert areas to target object to array structure
  const areasArray = Object.entries(data.areas_to_target).map(([heading, content]) => ({
    main: heading,
    content: content
  }));

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
              const newStrengths = { ...data.strengths };
              const newKey = `New Strength ${Object.keys(newStrengths).length + 1}`;
              newStrengths[newKey] = '';
              onUpdate({
                ...data,
                strengths: newStrengths
              });
            }}
          >
            <Plus className="h-4 w-4 mr-1" /> Add Subheading
          </Button>
        </SectionHeading>
        
        {strengthsArray.map((strength, index) => (
          <div key={index} className="mb-8">
            <EditableSubheading
              value={strength.main}
              onChange={(newValue) => {
                const newStrengths = { ...data.strengths };
                delete newStrengths[strength.main];
                newStrengths[newValue] = strength.content;
                onUpdate({
                  ...data,
                  strengths: newStrengths
                });
              }}
              onDelete={() => {
                const newStrengths = { ...data.strengths };
                delete newStrengths[strength.main];
                onUpdate({
                  ...data,
                  strengths: newStrengths
                });
              }}
            />
            <EditableText
              value={strength.content}
              onChange={(newValue) => {
                const newStrengths = { ...data.strengths };
                newStrengths[strength.main] = newValue;
                onUpdate({
                  ...data,
                  strengths: newStrengths
                });
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
              const newAreas = { ...data.areas_to_target };
              const newKey = `New Area ${Object.keys(newAreas).length + 1}`;
              newAreas[newKey] = '';
              onUpdate({
                ...data,
                areas_to_target: newAreas
              });
            }}
          >
            <Plus className="h-4 w-4 mr-1" /> Add Subheading
          </Button>
        </SectionHeading>
        
        {areasArray.map((area, index) => (
          <div key={index} className="mb-8">
            <EditableSubheading
              value={area.main}
              onChange={(newValue) => {
                const newAreas = { ...data.areas_to_target };
                delete newAreas[area.main];
                newAreas[newValue] = area.content;
                onUpdate({
                  ...data,
                  areas_to_target: newAreas
                });
              }}
              onDelete={() => {
                const newAreas = { ...data.areas_to_target };
                delete newAreas[area.main];
                onUpdate({
                  ...data,
                  areas_to_target: newAreas
                });
              }}
            />
            <EditableText
              value={area.content}
              onChange={(newValue) => {
                const newAreas = { ...data.areas_to_target };
                newAreas[area.main] = newValue;
                onUpdate({
                  ...data,
                  areas_to_target: newAreas
                });
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
