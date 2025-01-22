import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { SectionHeading } from './shared/SectionHeading';
import { EditableSubheading } from './shared/EditableSubheading';
import { EditableText } from './shared/EditableText';
import { InterviewAnalysis, SubheadingSection, NextStep } from '@/lib/types';

interface SplitScreenSectionProps {
  data: InterviewAnalysis;
  onUpdate: (newData: InterviewAnalysis) => void;
  isAISuggestion?: boolean;
}

interface DragItem {
  type: string;
  section: 'strengths' | 'areas_to_target' | 'next_steps';
  index: number;
  data: any;
  isSubPoint?: boolean;
}

const DraggableSection: React.FC<{
  children: React.ReactNode;
  onDragStart: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  className?: string;
}> = ({ children, onDragStart, onDrop, className = '' }) => {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div 
      draggable={true}
      onDragStart={onDragStart}
      onDrop={onDrop}
      onDragOver={handleDragOver}
      className={`relative group ${className}`}
    >
      <div className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-move">
        <GripVertical className="w-6 h-6 text-gray-400" />
      </div>
      {children}
    </div>
  );
};

const AnalysisSection: React.FC<SplitScreenSectionProps> = ({ data, onUpdate, isAISuggestion = false }) => {
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

  const handleDragStart = (
    section: 'strengths' | 'areas_to_target' | 'next_steps',
    index: number,
    data: any,
    isSubPoint: boolean = false
  ) => (e: React.DragEvent) => {
    const dragData: DragItem = {
      type: 'section-content',
      section,
      index,
      data,
      isSubPoint
    };
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
  };

  const handleDrop = (
    section: 'strengths' | 'areas_to_target' | 'next_steps',
    index: number
  ) => (e: React.DragEvent) => {
    e.preventDefault();
    if (isAISuggestion) return;

    try {
      const dragData: DragItem = JSON.parse(e.dataTransfer.getData('application/json'));
      const newData = { ...data };

      if (section === 'strengths' || section === 'areas_to_target') {
        const entries = Object.entries(newData[section]);
        if (dragData.data.main && dragData.data.content) {
          entries[index] = [dragData.data.main, dragData.data.content];
          newData[section] = Object.fromEntries(entries);
        }
      } else if (section === 'next_steps') {
        const newSteps = [...newData.next_steps];
        if (dragData.isSubPoint && typeof newSteps[index] !== 'string') {
          // Handling sub-point drag and drop
          const targetStep = newSteps[index] as { main: string; sub_points: string[] };
          if (targetStep && targetStep.sub_points) {
            targetStep.sub_points.push(dragData.data);
          }
        } else {
          // Handling main step drag and drop
          newSteps[index] = dragData.data;
        }
        newData.next_steps = newSteps;
      }

      onUpdate(newData);
    } catch (error) {
      console.error('Error handling drop:', error);
    }
  };

  const updateStrengthSection = (index: number, field: 'main' | 'content', value: string) => {
    const newStrengths = [...strengthsArray];
    newStrengths[index][field] = value;
    const newData = { ...data };
    newData.strengths = Object.fromEntries(
      newStrengths.map(item => [item.main, item.content])
    );
    onUpdate(newData);
  };

  const updateAreaSection = (index: number, field: 'main' | 'content', value: string) => {
    const newAreas = [...areasArray];
    newAreas[index][field] = value;
    const newData = { ...data };
    newData.areas_to_target = Object.fromEntries(
      newAreas.map(item => [item.main, item.content])
    );
    onUpdate(newData);
  };

  const addNextStep = (type: 'text' | 'points') => {
    const newData = { ...data };
    if (type === 'text') {
      newData.next_steps = [...newData.next_steps, ''];
    } else {
      newData.next_steps = [...newData.next_steps, { main: 'New Step', sub_points: [''] }];
    }
    onUpdate(newData);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">
        {isAISuggestion ? 'AI Suggestions' : 'Final Report'}
      </h2>

      {/* Strengths Section */}
      <section className="transition-all duration-200 ease-in-out">
        <div>
          <SectionHeading title="Strengths" className="text-xl font-bold text-gray-900">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                const newStrengths = [...strengthsArray, { main: 'New Strength', content: '' }];
                const newData = { ...data };
                newData.strengths = Object.fromEntries(
                  newStrengths.map(item => [item.main, item.content])
                );
                onUpdate(newData);
              }}
            >
              <Plus className="h-4 w-4 mr-1" /> Add Subheading
            </Button>
          </SectionHeading>
          
          {strengthsArray.map((strength, index) => (
            <DraggableSection
              key={index}
              onDragStart={handleDragStart('strengths', index, strength)}
              onDrop={!isAISuggestion ? handleDrop('strengths', index) : undefined}
              className="mb-4"
            >
              <EditableSubheading
                value={strength.main}
                onChange={(newValue) => updateStrengthSection(index, 'main', newValue)}
                onDelete={() => {
                  const newStrengths = strengthsArray.filter((_, i) => i !== index);
                  const newData = { ...data };
                  newData.strengths = Object.fromEntries(
                    newStrengths.map(item => [item.main, item.content])
                  );
                  onUpdate(newData);
                }}
              />
              <EditableText
                value={strength.content}
                onChange={(newValue) => updateStrengthSection(index, 'content', newValue)}
                minHeight="180px"
              />
            </DraggableSection>
          ))}
        </div>
      </section>

      {/* Areas to Target Section */}
      <section className="transition-all duration-200 ease-in-out">
        <div>
          <SectionHeading title="Areas to Target" className="text-xl font-bold text-gray-900">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                const newAreas = [...areasArray, { main: 'New Area', content: '' }];
                const newData = { ...data };
                newData.areas_to_target = Object.fromEntries(
                  newAreas.map(item => [item.main, item.content])
                );
                onUpdate(newData);
              }}
            >
              <Plus className="h-4 w-4 mr-1" /> Add Subheading
            </Button>
          </SectionHeading>
          
          {areasArray.map((area, index) => (
            <DraggableSection
              key={index}
              onDragStart={handleDragStart('areas_to_target', index, area)}
              onDrop={!isAISuggestion ? handleDrop('areas_to_target', index) : undefined}
              className="mb-4"
            >
              <EditableSubheading
                value={area.main}
                onChange={(newValue) => updateAreaSection(index, 'main', newValue)}
                onDelete={() => {
                  const newAreas = areasArray.filter((_, i) => i !== index);
                  const newData = { ...data };
                  newData.areas_to_target = Object.fromEntries(
                    newAreas.map(item => [item.main, item.content])
                  );
                  onUpdate(newData);
                }}
              />
              <EditableText
                value={area.content}
                onChange={(newValue) => updateAreaSection(index, 'content', newValue)}
                minHeight="220px"
              />
            </DraggableSection>
          ))}
        </div>
      </section>

      {/* Next Steps Section */}
      <section className="transition-all duration-200 ease-in-out">
        <div>
          <SectionHeading title="Next Steps" className="text-xl font-bold text-gray-900">
            <div className="space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => addNextStep('text')}
              >
                <Plus className="h-4 w-4 mr-1" /> Add Text
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => addNextStep('points')}
              >
                <Plus className="h-4 w-4 mr-1" /> Add Points
              </Button>
            </div>
          </SectionHeading>

          {data.next_steps.map((step, index) => (
            <DraggableSection
              key={index}
              onDragStart={handleDragStart('next_steps', index, step)}
              onDrop={!isAISuggestion ? handleDrop('next_steps', index) : undefined}
              className="mb-4"
            >
              {typeof step === 'string' ? (
                <div className="flex gap-2">
                  <EditableText
                    value={step}
                    onChange={(newValue) => {
                      const newSteps = [...data.next_steps];
                      newSteps[index] = newValue;
                      onUpdate({ ...data, next_steps: newSteps });
                    }}
                    className="flex-1"
                    minHeight="180px"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const newSteps = data.next_steps.filter((_, i) => i !== index);
                      onUpdate({ ...data, next_steps: newSteps });
                    }}
                    className="text-gray-500 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex flex-col w-full">
                    {index === 0 ? (
                      <div className="w-full">
                        <EditableText
                          value={step.main}
                          onChange={(newValue) => {
                            const newSteps = [...data.next_steps];
                            newSteps[index] = { ...step, main: newValue };
                            onUpdate({ ...data, next_steps: newSteps });
                          }}
                          className="w-full"
                        />
                      </div>
                    ) : (
                      <div className="w-full">
                        <EditableSubheading
                          value={step.main}
                          onChange={(newValue) => {
                            const newSteps = [...data.next_steps];
                            newSteps[index] = { ...step, main: newValue };
                            onUpdate({ ...data, next_steps: newSteps });
                          }}
                          onDelete={() => {
                            const newSteps = data.next_steps.filter((_, i) => i !== index);
                            onUpdate({ ...data, next_steps: newSteps });
                          }}
                          style={{ width: '100%', minWidth: '500px' }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="ml-6 space-y-2">
                    {step.sub_points.map((subPoint, subIndex) => (
                      <DraggableSection
                        key={subIndex}
                        onDragStart={handleDragStart('next_steps', subIndex, subPoint, true)}
                        onDrop={!isAISuggestion ? handleDrop('next_steps', subIndex) : undefined}
                        className="flex gap-2"
                      >
                        <EditableText
                          value={subPoint}
                          onChange={(newValue) => {
                            const newSteps = [...data.next_steps];
                            const newStep = { ...step };
                            newStep.sub_points = [...step.sub_points];
                            newStep.sub_points[subIndex] = newValue;
                            newSteps[index] = newStep;
                            onUpdate({ ...data, next_steps: newSteps });
                          }}
                          className="flex-1 min-h-[60px]"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            const newSteps = [...data.next_steps];
                            const newStep = { ...step };
                            newStep.sub_points = step.sub_points.filter((_, i) => i !== subIndex);
                            newSteps[index] = newStep;
                            onUpdate({ ...data, next_steps: newSteps });
                          }}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                      </DraggableSection>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newSteps = [...data.next_steps];
                        const newStep = { ...step };
                        newStep.sub_points = [...step.sub_points, ''];
                        newSteps[index] = newStep;
                        onUpdate({ ...data, next_steps: newSteps });
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add Sub-point
                    </Button>
                  </div>
                </div>
              )}
            </DraggableSection>
          ))}
        </div>
      </section>
    </div>
  );
};

export function SplitScreenAnalysis({ data, onUpdate }) {
  const createEmptyReport = () => {
    return {
      name: data.name || '',
      date: data.date || '',
      strengths: Object.fromEntries(
        Object.keys(data.strengths).map((_, i) => [`New Strength ${i + 1}`, ''])
      ),
      areas_to_target: Object.fromEntries(
        Object.keys(data.areas_to_target).map((_, i) => [`New Area ${i + 1}`, ''])
      ),
      next_steps: data.next_steps.map(step => 
        typeof step === 'string' ? '' : { main: 'New Step', sub_points: Array(step.sub_points.length).fill('') }
      )
    };
  };

  const [finalReport, setFinalReport] = useState(createEmptyReport());
  const [aiSuggestions, setAiSuggestions] = useState(data);

  const updateCommonFields = (field: 'name' | 'date', value: string) => {
    const newFinalReport = { ...finalReport, [field]: value };
    const newAiSuggestions = { ...aiSuggestions, [field]: value };
    setFinalReport(newFinalReport);
    setAiSuggestions(newAiSuggestions);
    onUpdate(newAiSuggestions);
  };

  useEffect(() => {
    const syncHeights = () => {
      requestAnimationFrame(() => {
        const sectionTypes = ['strengths', 'areas', 'next-steps'];
        sectionTypes.forEach((type, index) => {
          const leftSection = document.querySelector(`.left-panel section:nth-of-type(${index + 1})`);
          const rightSection = document.querySelector(`.right-panel section:nth-of-type(${index + 1})`);
          
          if (leftSection && rightSection) {
            // Reset heights first
            leftSection.style.minHeight = 'auto';
            rightSection.style.minHeight = 'auto';
            
            // Get the actual content height
            const leftHeight = leftSection.getBoundingClientRect().height;
            const rightHeight = rightSection.getBoundingClientRect().height;
            
            // Only set a minimum height if either side has content
            if (leftHeight > 0 || rightHeight > 0) {
              const maxHeight = Math.max(leftHeight, rightHeight);
              leftSection.style.minHeight = `${maxHeight}px`;
              rightSection.style.minHeight = `${maxHeight}px`;
            }
          }
        });
      });
    };

    // Set up resize observer with debounce
    let resizeTimeout;
    const debouncedSync = () => {
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      resizeTimeout = setTimeout(syncHeights, 100);
    };

    const resizeObserver = new ResizeObserver(debouncedSync);
    const sections = document.querySelectorAll('.left-panel section, .right-panel section');
    sections.forEach(section => resizeObserver.observe(section));

    // Initial sync
    syncHeights();

    return () => {
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      resizeObserver.disconnect();
    };
  }, [finalReport, aiSuggestions]);

  return (
    <div className="space-y-6">
      {/* Common Name and Date Fields */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <Input
            value={aiSuggestions.name}
            onChange={(e) => updateCommonFields('name', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Date</label>
          <Input
            type="date"
            value={aiSuggestions.date}
            onChange={(e) => updateCommonFields('date', e.target.value)}
          />
        </div>
      </div>

      {/* Split Screen Content */}
      <div className="grid grid-cols-2 gap-6">
        <div className="left-panel border-r pr-4">
          <AnalysisSection 
            data={finalReport}
            onUpdate={setFinalReport}
            isAISuggestion={false}
          />
        </div>
        <div className="right-panel pl-4">
          <AnalysisSection 
            data={aiSuggestions}
            onUpdate={setAiSuggestions}
            isAISuggestion={true}
          />
        </div>
      </div>
    </div>
  );
}