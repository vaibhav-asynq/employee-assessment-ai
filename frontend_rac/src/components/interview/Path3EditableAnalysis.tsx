import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Sparkles } from 'lucide-react';
import { generateStrengthContent, generateAreaContent, generateNextSteps } from '@/lib/api';
import { SectionHeading } from './shared/SectionHeading';
import { EditableSubheading } from './shared/EditableSubheading';
import { EditableText } from './shared/EditableText';
import { InterviewAnalysis, NextStep, NextStepPoint, OrderedSection, SubheadingSection } from '@/lib/types';

interface EditableAnalysisProps {
  data: InterviewAnalysis;
  onUpdate: (data: InterviewAnalysis) => void;
  fileId: string | null;
  onStrengthsComplete?: (complete: boolean) => void;
  onAreasComplete?: (complete: boolean) => void;
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
  const updateTimeoutRef = useRef<NodeJS.Timeout>();

  const initialSections = {
    strengths: Object.entries(data.strengths).map(([heading, content], index) => ({
      id: `strength-${index + 1}`,
      heading,
      content,
      order: index
    })),
    areas: Object.entries(data.areas_to_target).map(([heading, content], index) => ({
      id: `area-${index + 1}`,
      heading,
      content,
      order: index
    }))
  };

  const [sections, setSections] = useState<{
    strengths: OrderedSection[];
    areas: OrderedSection[];
  }>(initialSections);

  // Update sections when data changes
  useEffect(() => {
    setSections({
      strengths: Object.entries(data.strengths).map(([heading, content], index) => ({
        id: `strength-${index + 1}`,
        heading,
        content,
        order: index
      })),
      areas: Object.entries(data.areas_to_target).map(([heading, content], index) => ({
        id: `area-${index + 1}`,
        heading,
        content,
        order: index
      }))
    });
  }, [data]);

  // Debounced parent state update
  const debouncedUpdateParent = useCallback((newSections: typeof sections) => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = setTimeout(() => {
      try {
        // Convert ordered sections back to SubheadingSection format
        const strengthsObj: SubheadingSection = Object.fromEntries(
          newSections.strengths
            .sort((a, b) => a.order - b.order)
            .map(s => [s.heading, s.content])
        );
        const areasObj: SubheadingSection = Object.fromEntries(
          newSections.areas
            .sort((a, b) => a.order - b.order)
            .map(a => [a.heading, a.content])
        );

        const analysisData: InterviewAnalysis = {
          ...data,
          strengths: strengthsObj,
          areas_to_target: areasObj
        };
        onUpdate(analysisData);
      } catch (error) {
        console.error('Error updating parent state:', error);
      }
    }, 300);
  }, [data, onUpdate]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  // Check completion status whenever sections change
  useEffect(() => {
    if (onStrengthsComplete || onAreasComplete) {
      const strengthsComplete = sections.strengths.every(s => {
        const defaultPattern = /^Strength \d+$/;
        return !defaultPattern.test(s.heading) && s.content.trim() !== '';
      });
      
      const areasComplete = sections.areas.every(a => {
        const defaultPattern = /^Development Area \d+$/;
        return !defaultPattern.test(a.heading) && a.content.trim() !== '';
      });
      
      if (onStrengthsComplete) onStrengthsComplete(strengthsComplete);
      if (onAreasComplete) onAreasComplete(areasComplete);
    }
  }, [sections, onStrengthsComplete, onAreasComplete]);

  // Section update handlers
  const updateSection = useCallback((
    type: 'strengths' | 'areas',
    id: string,
    updates: Partial<OrderedSection>
  ) => {
    setSections(prev => {
      const newSections = {
        ...prev,
        [type]: prev[type].map(section => 
          section.id === id ? { ...section, ...updates } : section
        )
      };
      debouncedUpdateParent(newSections);
      return newSections;
    });
  }, [debouncedUpdateParent]);

  const deleteSection = useCallback((
    type: 'strengths' | 'areas',
    id: string
  ) => {
    setSections(prev => {
      const filtered = prev[type].filter(section => section.id !== id);
      // Reorder remaining items
      const reordered = filtered.map((section, index) => ({
        ...section,
        order: index
      }));
      const newSections = {
        ...prev,
        [type]: reordered
      };
      debouncedUpdateParent(newSections);
      return newSections;
    });
  }, [debouncedUpdateParent]);

  const addSection = useCallback((type: 'strengths' | 'areas') => {
    setSections(prev => {
      const sections = prev[type];
      const newId = `${type === 'strengths' ? 'strength' : 'area'}-${sections.length + 1}`;
      const newHeading = type === 'strengths' 
        ? `Strength ${sections.length + 1}`
        : `Development Area ${sections.length + 1}`;
      
      const newSection: OrderedSection = {
        id: newId,
        heading: newHeading,
        content: '',
        order: sections.length
      };
      
      const newSections = {
        ...prev,
        [type]: [...sections, newSection]
      };
      debouncedUpdateParent(newSections);
      return newSections;
    });
  }, [debouncedUpdateParent]);

  // Content generation handlers
  const handleGenerateStrength = useCallback(async (heading: string) => {
    if (!fileId) {
      console.error('No file ID found');
      return;
    }

    try {
      setLoadingStrength(heading);
      const content = await generateStrengthContent(heading, fileId);
      setSections(prev => {
        const newSections = {
          ...prev,
          strengths: prev.strengths.map(s => 
            s.heading === heading ? { ...s, content } : s
          )
        };
        debouncedUpdateParent(newSections);
        return newSections;
      });
    } catch (error) {
      console.error('Error generating strength content:', error);
    } finally {
      setLoadingStrength(null);
    }
  }, [fileId, debouncedUpdateParent]);

  const handleGenerateArea = useCallback(async (heading: string) => {
    if (!fileId) {
      console.error('No file ID found');
      return;
    }

    try {
      setLoadingArea(heading);
      const content = await generateAreaContent(heading, fileId);
      setSections(prev => {
        const newSections = {
          ...prev,
          areas: prev.areas.map(a => 
            a.heading === heading ? { ...a, content } : a
          )
        };
        debouncedUpdateParent(newSections);
        return newSections;
      });
    } catch (error) {
      console.error('Error generating area content:', error);
    } finally {
      setLoadingArea(null);
    }
  }, [fileId, debouncedUpdateParent]);

  const handleGenerateNextSteps = useCallback(async () => {
    if (!fileId) {
      console.error('No file ID found');
      return;
    }

    try {
      setLoadingNextSteps(true);
      // Convert areas to SubheadingSection format for API
      const areasObj: SubheadingSection = Object.fromEntries(
        sections.areas
          .sort((a, b) => a.order - b.order)
          .map(area => [area.heading, area.content])
      );
      const nextSteps = await generateNextSteps(areasObj, fileId);
      onUpdate({
        ...data,
        next_steps: nextSteps
      });
    } catch (error) {
      console.error('Error generating next steps:', error);
    } finally {
      setLoadingNextSteps(false);
    }
  }, [fileId, sections.areas, data, onUpdate]);

  // Render section
  const renderSection = useCallback((
    type: 'strengths' | 'areas',
    section: OrderedSection,
    loading: string | null,
    onGenerate: (heading: string) => Promise<void>
  ) => (
    <div key={section.id} className="mb-8">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1">
          <EditableSubheading
            value={section.heading}
            onChange={(newHeading) => {
              updateSection(type, section.id, { heading: newHeading });
            }}
            onDelete={() => {
              deleteSection(type, section.id);
            }}
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onGenerate(section.heading)}
          disabled={loading === section.heading}
          className="text-gray-500 whitespace-nowrap flex items-center"
        >
          {loading === section.heading ? (
            <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
          ) : (
            <Sparkles className="h-4 w-4 mr-2" />
          )}
          Generate with AI
        </Button>
      </div>
      <EditableText
        value={section.content}
        onChange={(newContent) => {
          updateSection(type, section.id, { content: newContent });
        }}
        minHeight="180px"
      />
    </div>
  ), [updateSection, deleteSection]);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold tracking-tight mb-8">AI Suggestions</h2>

      {/* Strengths Section */}
      <section className="mb-8">
        <SectionHeading title="STRENGTHS" className="text-xl font-semibold text-gray-900">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => addSection('strengths')}
          >
            <Plus className="h-4 w-4 mr-1" /> Add Subheading
          </Button>
        </SectionHeading>
        
        {sections.strengths
          .sort((a, b) => a.order - b.order)
          .map(strength => 
            renderSection('strengths', strength, loadingStrength, handleGenerateStrength)
          )}
      </section>

      {/* Areas to Target Section */}
      <section className="mb-8">
        <SectionHeading title="AREAS TO TARGET" className="text-xl font-semibold text-gray-900">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => addSection('areas')}
          >
            <Plus className="h-4 w-4 mr-1" /> Add Subheading
          </Button>
        </SectionHeading>
        
        {sections.areas
          .sort((a, b) => a.order - b.order)
          .map(area => 
            renderSection('areas', area, loadingArea, handleGenerateArea)
          )}
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
              onClick={handleGenerateNextSteps}
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
