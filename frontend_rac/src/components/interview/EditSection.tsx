import React, { useMemo } from 'react';
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

  const handleDrop = (targetSection: string, targetIndex: number, existingSubheading?: string) => (e: React.DragEvent) => {
    e.preventDefault();
    try {
      const dragData: DragData = JSON.parse(e.dataTransfer.getData('application/json'));
      if (dragData.type !== 'section-content') return;

      const newData = { ...data };

      if (targetSection === 'strengths' || targetSection === 'areas_to_target') {
        const orderedEntries = Object.entries(newData[targetSection]);
        
        if (existingSubheading) {
          // Replace content in existing box while maintaining position
          const index = orderedEntries.findIndex(([key]) => key === existingSubheading);
          if (index !== -1) {
            orderedEntries[index] = [dragData.content.subheading || existingSubheading, dragData.content.text];
          }
        } else {
          // Insert at specific index
          orderedEntries.splice(targetIndex, 0, [
            dragData.content.subheading || `Item ${orderedEntries.length + 1}`,
            dragData.content.text
          ]);
        }
        
        newData[targetSection] = Object.fromEntries(orderedEntries);
      } else if (targetSection === 'next_steps') {
        const newSteps = [...newData.next_steps];
        const newContent = dragData.content.subPoints 
          ? {
              main: dragData.content.text,
              sub_points: [...dragData.content.subPoints]
            }
          : dragData.content.text;
        
        if (targetIndex < newSteps.length) {
          newSteps[targetIndex] = newContent;
        } else {
          newSteps.splice(targetIndex, 0, newContent);
        }
        newData.next_steps = newSteps;
      }

      onUpdate(newData);
    } catch (error) {
      console.error('Error handling drop:', error);
    }
  };

  // Calculate maximum entries for each section
  const maxEntries = useMemo(() => {
    const humanData = data;
    const aiDataEntries = aiData || { strengths: {}, areas_to_target: {}, next_steps: [] };
    
    return {
      strengths: Math.max(
        Object.keys(humanData.strengths).length,
        Object.keys(aiDataEntries.strengths).length
      ),
      areas_to_target: Math.max(
        Object.keys(humanData.areas_to_target).length,
        Object.keys(aiDataEntries.areas_to_target).length
      ),
      next_steps: Math.max(
        humanData.next_steps.length,
        aiDataEntries.next_steps.length
      )
    };
  }, [data, aiData]);

  const updateSectionHeading = (
    section: 'strengths' | 'areas_to_target',
    oldHeading: string,
    newHeading: string,
    currentData: InterviewAnalysis,
    updateFn: (newData: InterviewAnalysis) => void
  ) => {
    const orderedEntries = Object.entries(currentData[section]);
    const index = orderedEntries.findIndex(([key]) => key === oldHeading);
    
    if (index !== -1) {
      // Replace the heading while maintaining position
      orderedEntries[index] = [newHeading, orderedEntries[index][1]];
      const newSection = Object.fromEntries(orderedEntries);
      
      updateFn({
        ...currentData,
        [section]: newSection
      });
    }
  };

  const renderSection = (side: 'human' | 'ai') => {
    const currentData = side === 'human' ? data : (aiData || data);
    const currentUpdate = side === 'human' ? onUpdate : onAIUpdate;
    const isAISide = side === 'ai';

    const createDropZone = (section: string, index: number) => {
      if (isAISide) return null;
      
      return (
        <div 
          className="h-16 border-2 border-dashed border-gray-300 rounded-lg my-4 flex items-center justify-center text-gray-400 hover:border-blue-300 hover:bg-blue-50 transition-colors duration-200"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop(section, index)}
        >
          Drop here to add new item
        </div>
      );
    };

    const renderEmptyBoxes = (section: string, count: number) => {
      if (isAISide) return null;
      
      return Array.from({ length: count }).map((_, index) => (
        <div key={`empty-${section}-${index}`} className="h-16 my-4" />
      ));
    };

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
            <React.Fragment key={subheading}>
              <DraggableSection
                onDragStart={handleDragStart('strengths', index, subheading, text)}
                onDrop={!isAISide ? handleDrop('strengths', index, subheading) : undefined}
                className="mb-2"
              >
                <EditableSubheading
                  value={subheading}
                  onChange={(newValue) => {
                    updateSectionHeading('strengths', subheading, newValue, currentData, currentUpdate);
                  }}
                  onDelete={!isAISide ? () => {
                    const orderedEntries = Object.entries(currentData.strengths);
                    const filteredEntries = orderedEntries.filter(([key]) => key !== subheading);
                    currentUpdate({
                      ...currentData,
                      strengths: Object.fromEntries(filteredEntries)
                    });
                  } : undefined}
                />
                <EditableText
                  value={text}
                  onChange={(newValue) => {
                    const orderedEntries = Object.entries(currentData.strengths);
                    const index = orderedEntries.findIndex(([key]) => key === subheading);
                    if (index !== -1) {
                      orderedEntries[index] = [subheading, newValue];
                      currentUpdate({
                        ...currentData,
                        strengths: Object.fromEntries(orderedEntries)
                      });
                    }
                  }}
                  minHeight="200px"
                />
              </DraggableSection>
              {!isAISide && createDropZone('strengths', index + 1)}
            </React.Fragment>
          ))}
          {renderEmptyBoxes('strengths', maxEntries.strengths - Object.keys(currentData.strengths).length)}
        </div>

        <div id={`${side}-areas-wrapper`} className="mb-8">
          <SectionHeading title="Areas to Target" className="text-xl font-bold text-gray-900">
            {!isAISide && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const newKey = `Area${Object.keys(data.areas_to_target).length + 1}`;
                  onUpdate({
                    ...data,
                    areas_to_target: { ...data.areas_to_target, [newKey]: '' }
                  });
                }}
              >
                <Plus className="h-4 w-4 mr-1" /> Add Area
              </Button>
            )}
          </SectionHeading>

          {Object.entries(currentData.areas_to_target).map(([subheading, text], index) => (
            <React.Fragment key={subheading}>
              <DraggableSection
                onDragStart={handleDragStart('areas_to_target', index, subheading, text)}
                onDrop={!isAISide ? handleDrop('areas_to_target', index, subheading) : undefined}
                className="mb-2"
              >
                <EditableSubheading
                  value={subheading}
                  onChange={(newValue) => {
                    updateSectionHeading('areas_to_target', subheading, newValue, currentData, currentUpdate);
                  }}
                  onDelete={!isAISide ? () => {
                    const orderedEntries = Object.entries(currentData.areas_to_target);
                    const filteredEntries = orderedEntries.filter(([key]) => key !== subheading);
                    currentUpdate({
                      ...currentData,
                      areas_to_target: Object.fromEntries(filteredEntries)
                    });
                  } : undefined}
                />
                <EditableText
                  value={text}
                  onChange={(newValue) => {
                    const orderedEntries = Object.entries(currentData.areas_to_target);
                    const index = orderedEntries.findIndex(([key]) => key === subheading);
                    if (index !== -1) {
                      orderedEntries[index] = [subheading, newValue];
                      currentUpdate({
                        ...currentData,
                        areas_to_target: Object.fromEntries(orderedEntries)
                      });
                    }
                  }}
                  minHeight="220px"
                />
              </DraggableSection>
              {!isAISide && createDropZone('areas_to_target', index + 1)}
            </React.Fragment>
          ))}
          {renderEmptyBoxes('areas_to_target', maxEntries.areas_to_target - Object.keys(currentData.areas_to_target).length)}
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
            <React.Fragment key={index}>
              <DraggableSection
                onDragStart={handleDragStart(
                  'next_steps',
                  index,
                  undefined,
                  typeof step === 'string' ? step : step.main,
                  typeof step === 'string' ? undefined : step.sub_points
                )}
                onDrop={!isAISide ? handleDrop('next_steps', index) : undefined}
                className="mb-2"
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
                    </div>
                  </div>
                )}
              </DraggableSection>
              {!isAISide && createDropZone('next_steps', index + 1)}
            </React.Fragment>
          ))}
          {renderEmptyBoxes('next_steps', maxEntries.next_steps - currentData.next_steps.length)}
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
}