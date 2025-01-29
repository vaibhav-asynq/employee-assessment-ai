import React from 'react';
import { RawInterviewData } from './RawInterviewData';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EditableSubheading } from './shared/EditableSubheading';
import { EditableText } from './shared/EditableText';
import { SectionHeading } from './shared/SectionHeading';

interface RawDataSplitScreenProps {
  rawData: {
    strengths: { [key: string]: any };
    areas_to_target: { [key: string]: any };
  } | null;
  loading: boolean;
  error: string;
  editableContent: {
    strengths: { [key: string]: { title: string; content: string } };
    areas_to_target: { [key: string]: { title: string; content: string } };
    next_steps: Array<string | { main: string; sub_points: string[] }>;
  };
  setEditableContent: React.Dispatch<React.SetStateAction<{
    strengths: { [key: string]: { title: string; content: string } };
    areas_to_target: { [key: string]: { title: string; content: string } };
    next_steps: Array<string | { main: string; sub_points: string[] }>;
  }>>;
}

export function RawDataSplitScreen({ 
  rawData, 
  loading, 
  error, 
  editableContent, 
  setEditableContent 
}: RawDataSplitScreenProps) {
  const addNextStep = (type: 'text' | 'points') => {
    setEditableContent(prev => ({
      ...prev,
      next_steps: [
        ...prev.next_steps,
        type === 'text' ? '' : { main: '', sub_points: [''] }
      ]
    }));
  };

  return (
    <div className="grid grid-cols-2 gap-6 min-h-0">
      {/* Left Panel - Raw Data */}
      <div className="left-panel border-r pr-4 flex-1 overflow-auto">
        <RawInterviewData 
          data={rawData} 
          loading={loading} 
          error={error}
        />
      </div>
      
      {/* Right Panel - Editable Text Boxes */}
      <div className="right-panel pl-4 flex-1 overflow-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold tracking-tight mb-8">Human Report</h2>
          
          {/* Strengths Evidence Section */}
          <section className="mb-8">
            <SectionHeading title="STRENGTHS" className="text-xl font-semibold text-gray-900">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const newKey = `New Strength ${Object.keys(editableContent.strengths).length + 1}`;
                  setEditableContent(prev => ({
                    ...prev,
                    strengths: {
                      ...prev.strengths,
                      [newKey]: { title: newKey, content: '' }
                    }
                  }));
                }}
              >
                <Plus className="h-4 w-4 mr-1" /> Add Subheading
              </Button>
            </SectionHeading>
            
            <div>
              {Object.entries(editableContent.strengths).map(([category, value]) => (
                <div key={category} className="mb-8">
                  <EditableSubheading
                    value={value.title}
                    onChange={(newValue) => {
                      setEditableContent(prev => ({
                        ...prev,
                        strengths: {
                          ...prev.strengths,
                          [category]: {
                            ...prev.strengths[category],
                            title: newValue
                          }
                        }
                      }));
                    }}
                    onDelete={() => {
                      setEditableContent(prev => {
                        const newStrengths = { ...prev.strengths };
                        delete newStrengths[category];
                        return {
                          ...prev,
                          strengths: newStrengths
                        };
                      });
                    }}
                  />
                  <EditableText
                    value={value.content}
                    onChange={(newValue) => {
                      setEditableContent(prev => ({
                        ...prev,
                        strengths: {
                          ...prev.strengths,
                          [category]: {
                            ...prev.strengths[category],
                            content: newValue
                          }
                        }
                      }));
                    }}
                    minHeight="180px"
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Areas to Target Evidence Section */}
          <section className="mb-8">
            <SectionHeading title="AREAS TO TARGET" className="text-xl font-semibold text-gray-900">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const newKey = `New Area ${Object.keys(editableContent.areas_to_target).length + 1}`;
                  setEditableContent(prev => ({
                    ...prev,
                    areas_to_target: {
                      ...prev.areas_to_target,
                      [newKey]: { title: newKey, content: '' }
                    }
                  }));
                }}
              >
                <Plus className="h-4 w-4 mr-1" /> Add Subheading
              </Button>
            </SectionHeading>
            
            <div>
              {Object.entries(editableContent.areas_to_target).map(([category, value]) => (
                <div key={category} className="mb-8">
                  <EditableSubheading
                    value={value.title}
                    onChange={(newValue) => {
                      setEditableContent(prev => ({
                        ...prev,
                        areas_to_target: {
                          ...prev.areas_to_target,
                          [category]: {
                            ...prev.areas_to_target[category],
                            title: newValue
                          }
                        }
                      }));
                    }}
                    onDelete={() => {
                      setEditableContent(prev => {
                        const newAreas = { ...prev.areas_to_target };
                        delete newAreas[category];
                        return {
                          ...prev,
                          areas_to_target: newAreas
                        };
                      });
                    }}
                  />
                  <EditableText
                    value={value.content}
                    onChange={(newValue) => {
                      setEditableContent(prev => ({
                        ...prev,
                        areas_to_target: {
                          ...prev.areas_to_target,
                          [category]: {
                            ...prev.areas_to_target[category],
                            content: newValue
                          }
                        }
                      }));
                    }}
                    minHeight="180px"
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Next Steps Section */}
          <section className="mb-8">
            <SectionHeading title="NEXT STEPS" className="text-xl font-semibold text-gray-900">
              <div className="flex gap-2">
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
            
            <div className="space-y-4">
              {editableContent.next_steps.map((step, index) => (
                <div key={index} className="space-y-2">
                  {typeof step === 'string' ? (
                    <div className="flex gap-2">
                      <EditableText
                        value={step}
                        onChange={(newValue) => {
                          const newSteps = [...editableContent.next_steps];
                          newSteps[index] = newValue;
                          setEditableContent(prev => ({
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
                          const newSteps = editableContent.next_steps.filter((_, i) => i !== index);
                          setEditableContent(prev => ({
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
                            const newSteps = [...editableContent.next_steps];
                            newSteps[index] = {
                              ...step,
                              main: e.target.value
                            };
                            setEditableContent(prev => ({
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
                            const newSteps = editableContent.next_steps.filter((_, i) => i !== index);
                            setEditableContent(prev => ({
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
                                const newSteps = [...editableContent.next_steps];
                                const newStep = { ...step };
                                newStep.sub_points = [...step.sub_points];
                                newStep.sub_points[pointIndex] = newValue;
                                newSteps[index] = newStep;
                                setEditableContent(prev => ({
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
                                const newSteps = [...editableContent.next_steps];
                                const newStep = { ...step };
                                newStep.sub_points = step.sub_points.filter((_, i) => i !== pointIndex);
                                newSteps[index] = newStep;
                                setEditableContent(prev => ({
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
                            const newSteps = [...editableContent.next_steps];
                            const newStep = { ...step };
                            newStep.sub_points = [...step.sub_points, ''];
                            newSteps[index] = newStep;
                            setEditableContent(prev => ({
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
      </div>
    </div>
  );
}
