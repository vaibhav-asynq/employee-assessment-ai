// src/components/interview/EditSection.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus } from 'lucide-react';
import { SectionHeading } from './shared/SectionHeading';
import { EditableSubheading } from './shared/EditableSubheading';
import { EditableText } from './shared/EditableText';
import { DraggableSection } from './shared/DraggableSection';
import { InterviewAnalysis } from '@/lib/types';

interface EditSectionProps {
  data: InterviewAnalysis;
  aiData?: InterviewAnalysis;
  onUpdate: (newData: InterviewAnalysis) => void;
  onAIUpdate: (newData: InterviewAnalysis) => void;
}

interface DragData {
  type: string;
  section: string;
  index: number;
  content: {
    subheading?: string;
    text: string;
    subPoints?: string[];
  };
}

export function EditSection({ data, aiData, onUpdate, onAIUpdate }: EditSectionProps) {
  const CommonHeader = () => (
    <div className="mb-8">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <Input
            value={data.name}
            onChange={(e) => onUpdate({ ...data, name: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Date</label>
          <Input
            type="date"
            value={data.date}
            onChange={(e) => onUpdate({ ...data, date: e.target.value })}
          />
        </div>
      </div>
    </div>
  );

  const handleDragStart = (section: string, index: number, subheading?: string, text?: string, subPoints?: string[]) => (e: React.DragEvent) => {
    const dragData: DragData = {
      type: 'section-content',
      section,
      index,
      content: {
        subheading,
        text: text || '',
        subPoints
      }
    };
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
  };

  const handleDrop = (targetSection: string, targetIndex: number) => (e: React.DragEvent) => {
    e.preventDefault();
    try {
      const dragData: DragData = JSON.parse(e.dataTransfer.getData('application/json'));
      if (dragData.type !== 'section-content') return;

      const newData = { ...data };

      // Handle drops based on section type
      if (targetSection === 'strengths' || targetSection === 'areas_to_target') {
        const sectionData = { ...newData[targetSection] };
        if (dragData.content.subheading) {
          // If dropping into an existing item
          const keys = Object.keys(sectionData);
          if (targetIndex < keys.length) {
            const targetKey = keys[targetIndex];
            sectionData[targetKey] = dragData.content.text;
          } else {
            // Create new item
            const newKey = dragData.content.subheading;
            sectionData[newKey] = dragData.content.text;
          }
        }
        newData[targetSection] = sectionData;
      } else if (targetSection === 'next_steps') {
        const newSteps = [...newData.next_steps];
        if (dragData.content.subPoints) {
          const newStep = {
            main: dragData.content.text,
            sub_points: [...dragData.content.subPoints]
          };
          if (targetIndex < newSteps.length) {
            newSteps[targetIndex] = newStep;
          } else {
            newSteps.push(newStep);
          }
        } else {
          if (targetIndex < newSteps.length) {
            newSteps[targetIndex] = dragData.content.text;
          } else {
            newSteps.push(dragData.content.text);
          }
        }
        newData.next_steps = newSteps;
      }

      onUpdate(newData);
    } catch (error) {
      console.error('Error handling drop:', error);
    }
  };

  const renderSection = (side: 'human' | 'ai') => {
    const currentData = side === 'human' ? data : (aiData || data);
    const currentUpdate = side === 'human' ? onUpdate : onAIUpdate;
    const isAISide = side === 'ai';

    return (
      <div id={`${side}-side`} className="w-full p-6 border rounded-lg space-y-8">
        <h2 className="text-2xl font-bold mb-6">
          {side === 'human' ? 'Final Report' : 'AI Suggestions'}
        </h2>

        <div id={`${side}-strengths-wrapper`} className="mb-8">
          <SectionHeading title="Strengths" className="text-xl font-bold text-gray-900">
            {!isAISide && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const newKey = `Subheading${Object.keys(data.strengths).length + 1}`;
                  onUpdate({
                    ...data,
                    strengths: { ...data.strengths, [newKey]: '' }
                  });
                }}
              >
                <Plus className="h-4 w-4 mr-1" /> Add Subheading
              </Button>
            )}
          </SectionHeading>
          
          {Object.entries(currentData.strengths).map(([subheading, text], index) => (
            <DraggableSection
              key={subheading}
              onDragStart={handleDragStart('strengths', index, subheading, text)}
              onDrop={!isAISide ? handleDrop('strengths', index) : undefined}
              className="mb-6"
            >
              <EditableSubheading
                value={subheading}
                onChange={(newValue) => {
                  const newStrengths = { ...currentData.strengths };
                  const currentText = newStrengths[subheading];
                  delete newStrengths[subheading];
                  newStrengths[newValue] = currentText;
                  currentUpdate({ ...currentData, strengths: newStrengths });
                }}
                onDelete={!isAISide ? () => {
                  const newStrengths = { ...currentData.strengths };
                  delete newStrengths[subheading];
                  currentUpdate({ ...currentData, strengths: newStrengths });
                } : undefined}
              />
              <EditableText
                value={text}
                onChange={(newValue) => {
                  currentUpdate({
                    ...currentData,
                    strengths: { ...currentData.strengths, [subheading]: newValue }
                  });
                }}
                minHeight="200px"
              />
            </DraggableSection>
          ))}
        </div>

        <div id={`${side}-areas-wrapper`} className="mb-8">
          <SectionHeading title="Areas to Target" className="text-xl font-bold text-gray-900">
            {!isAISide && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const newKey = `Subheading${Object.keys(data.areas_to_target).length + 1}`;
                  onUpdate({
                    ...data,
                    areas_to_target: { ...data.areas_to_target, [newKey]: '' }
                  });
                }}
              >
                <Plus className="h-4 w-4 mr-1" /> Add Subheading
              </Button>
            )}
          </SectionHeading>
          
          {Object.entries(currentData.areas_to_target).map(([subheading, text], index) => (
            <DraggableSection
              key={subheading}
              onDragStart={handleDragStart('areas_to_target', index, subheading, text)}
              onDrop={!isAISide ? handleDrop('areas_to_target', index) : undefined}
              className="mb-6"
            >
              <EditableSubheading
                value={subheading}
                onChange={(newValue) => {
                  const newAreas = { ...currentData.areas_to_target };
                  const currentText = newAreas[subheading];
                  delete newAreas[subheading];
                  newAreas[newValue] = currentText;
                  currentUpdate({ ...currentData, areas_to_target: newAreas });
                }}
                onDelete={!isAISide ? () => {
                  const newAreas = { ...currentData.areas_to_target };
                  delete newAreas[subheading];
                  currentUpdate({ ...currentData, areas_to_target: newAreas });
                } : undefined}
              />
              <EditableText
                value={text}
                onChange={(newValue) => {
                  currentUpdate({
                    ...currentData,
                    areas_to_target: { ...currentData.areas_to_target, [subheading]: newValue }
                  });
                }}
                minHeight="220px"
              />
            </DraggableSection>
          ))}
        </div>

        <div id={`${side}-nextsteps-wrapper`}>
          <SectionHeading title="Next Steps" className="text-xl font-bold text-gray-900">
            {!isAISide && (
              <div className="space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    currentUpdate({
                      ...currentData,
                      next_steps: [...currentData.next_steps, '']
                    });
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Text
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    currentUpdate({
                      ...currentData,
                      next_steps: [...currentData.next_steps, { main: '', sub_points: [''] }]
                    });
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Points
                </Button>
              </div>
            )}
          </SectionHeading>

          {currentData.next_steps.map((step, index) => (
            <DraggableSection
              key={index}
              onDragStart={handleDragStart(
                'next_steps',
                index,
                undefined,
                typeof step === 'string' ? step : step.main,
                typeof step === 'string' ? undefined : step.sub_points
              )}
              onDrop={!isAISide ? handleDrop('next_steps', index) : undefined}
              className="mb-6"
            >
              {typeof step === 'string' ? (
                <EditableText
                  value={step}
                  onChange={(newValue) => {
                    const newSteps = [...currentData.next_steps];
                    newSteps[index] = newValue;
                    currentUpdate({ ...currentData, next_steps: newSteps });
                  }}
                  minHeight="100px"
                />
              ) : (
                <div className="grid grid-cols-1">
                  <EditableText
                    value={step.main}
                    onChange={(newValue) => {
                      const newSteps = [...currentData.next_steps];
                      newSteps[index] = { ...step, main: newValue };
                      currentUpdate({ ...currentData, next_steps: newSteps });
                    }}
                    minHeight="100px"
                  />
                  <div className="ml-6 grid grid-cols-1 gap-4 pt-4">
                    {step.sub_points.map((subPoint, subIndex) => (
                      <EditableText
                        key={subIndex}
                        value={subPoint}
                        onChange={(newValue) => {
                          const newSteps = [...currentData.next_steps];
                          const newStep = { ...step };
                          newStep.sub_points[subIndex] = newValue;
                          newSteps[index] = newStep;
                          currentUpdate({ ...currentData, next_steps: newSteps });
                        }}
                        minHeight="120px"
                      />
                    ))}
                    {!isAISide && (
                      <div className="h-14">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newSteps = [...currentData.next_steps];
                            const newStep = { ...step };
                            newStep.sub_points.push('');
                            newSteps[index] = newStep;
                            currentUpdate({ ...currentData, next_steps: newSteps });
                          }}
                        >
                          <Plus className="h-4 w-4 mr-1" /> Add Sub-point
                        </Button>
                      </div>
                    )}
                    {isAISide && <div className="h-14" />}
                  </div>
                </div>
              )}
            </DraggableSection>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 w-full">
      <CommonHeader />
      <div className="grid grid-cols-2 gap-6">
        {renderSection('human')}
        {aiData && renderSection('ai')}
      </div>
    </div>
  );