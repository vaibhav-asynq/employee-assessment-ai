import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2 } from 'lucide-react';
import { SectionHeading } from './shared/SectionHeading';
import { EditableSubheading } from './shared/EditableSubheading';
import { EditableText } from './shared/EditableText';
import { InterviewAnalysis, SubheadingSection, NextStep } from '@/lib/types';

interface SplitScreenSectionProps {
  data: InterviewAnalysis;
  onUpdate: (newData: InterviewAnalysis) => void;
  isAISuggestion?: boolean;
}

function AnalysisSection({ data, onUpdate, isAISuggestion = false }: SplitScreenSectionProps) {
  // Basic info update
  const updateBasicInfo = (field: 'name' | 'date', value: string) => {
    const newData = { ...data };
    newData[field] = value;
    onUpdate(newData);
  };

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

  const addSubPoint = (stepIndex: number) => {
    const newData = { ...data };
    const step = newData.next_steps[stepIndex] as { main: string; sub_points: string[] };
    step.sub_points.push('');
    onUpdate(newData);
  };

  const removeSubPoint = (stepIndex: number, subIndex: number) => {
    const newData = { ...data };
    const step = newData.next_steps[stepIndex] as { main: string; sub_points: string[] };
    step.sub_points = step.sub_points.filter((_, i) => i !== subIndex);
    onUpdate(newData);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">
        {isAISuggestion ? 'AI Suggestions' : 'Final Report'}
      </h2>
      
      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <Input
            value={data.name}
            onChange={(e) => updateBasicInfo('name', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Date</label>
          <Input
            type="date"
            value={data.date}
            onChange={(e) => updateBasicInfo('date', e.target.value)}
          />
        </div>
      </div>

      {/* Strengths Section */}
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
          <div key={index} className="mb-4">
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
              minHeight="150px"
            />
          </div>
        ))}
      </div>

      {/* Areas to Target Section */}
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
          <div key={index} className="mb-4">
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
              minHeight="200px"
            />
          </div>
        ))}
      </div>

      {/* Next Steps Section */}
      <div>
        <SectionHeading title="Next Steps" className="text-xl font-bold text-gray-900">
          <div className="space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                const newData = { ...data };
                newData.next_steps = [...newData.next_steps, { main: 'New Step', sub_points: [''] }];
                onUpdate(newData);
              }}
            >
              <Plus className="h-4 w-4 mr-1" /> Add Step
            </Button>
          </div>
        </SectionHeading>

        {data.next_steps.map((step, index) => (
          <div key={index} className="mb-4 relative group">
            {index === 1 ? (
              // The reflection content box
              <div className="flex gap-2">
                <EditableText
                  value={step as string}
                  onChange={(newValue) => {
                    const newSteps = [...data.next_steps];
                    newSteps[index] = newValue;
                    onUpdate({ ...data, next_steps: newSteps });
                  }}
                  minHeight="120px"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    const newSteps = data.next_steps.filter((_, i) => i !== index);
                    onUpdate({ ...data, next_steps: newSteps });
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ) : typeof step === 'string' ? (
              // Other text-only steps
              <div className="flex gap-2">
                <EditableText
                  value={step}
                  onChange={(newValue) => {
                    const newSteps = [...data.next_steps];
                    newSteps[index] = newValue;
                    onUpdate({ ...data, next_steps: newSteps });
                  }}
                  minHeight="120px"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    const newSteps = data.next_steps.filter((_, i) => i !== index);
                    onUpdate({ ...data, next_steps: newSteps });
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              // Step with main point and sub-points
              <div className="space-y-2">
                <div className="flex gap-2">
                  {index === 0 ? (
                    <EditableText
                      value={step.main}
                      onChange={(newValue) => {
                        const newSteps = [...data.next_steps];
                        newSteps[index] = { ...step, main: newValue };
                        onUpdate({ ...data, next_steps: newSteps });
                      }}
                      minHeight="60px"
                    />
                  ) : (
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
                    />
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const newSteps = data.next_steps.filter((_, i) => i !== index);
                      onUpdate({ ...data, next_steps: newSteps });
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="ml-6 space-y-2">
                  {step.sub_points.map((subPoint, subIndex) => (
                    <div key={subIndex} className="flex gap-2">
                      <EditableText
                        value={subPoint}
                        onChange={(newValue) => {
                          const newData = { ...data };
                          const currentStep = newData.next_steps[index] as { main: string; sub_points: string[] };
                          currentStep.sub_points[subIndex] = newValue;
                          onUpdate(newData);
                        }}
                        minHeight="80px"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSubPoint(index, subIndex)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addSubPoint(index)}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add Sub-point
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SplitScreenAnalysis({ data, onUpdate }) {
  // Initialize empty final report with same structure
  const createEmptyReport = () => {
    return {
      name: '',
      date: '',
      strengths: Object.fromEntries(
        Object.keys(data.strengths).map((_, i) => [`New Strength ${i + 1}`, ''])
      ),
      areas_to_target: Object.fromEntries(
        Object.keys(data.areas_to_target).map((_, i) => [`New Area ${i + 1}`, ''])
      ),
      next_steps: [
        { 
          main: 'Prepare to have a discussion with Brian, Steve and Sandra after you have had time for reflection and they receive this report. Make sure you think through:', 
          sub_points: [
            'What did I hear from the feedback that was new or different than I expected?',
            'What resonated most for me? How does it connect to what I heard from other historical feedback I\'ve received?',
            'What am I focused on in the immediate short term and for the rest of 2024?',
            'What kind of support do I need from Brian, Steve and Sandra, or others?'
          ]
        },
        'Ian, after 3 years leading Carlyle\'s Aerospace, Defense & Government Services sector, you find yourself managing an 11-person team through significant transitions including RIFs, splitting time between DC/NYC offices, and no team offsite for the first time. While delivering strong performance (17% portfolio growth), you\'re focused on empowering your team and building the sector\'s external brand. This appeals to your need for developing others while maintaining work-life balance as a new empty nester. Keep those needs in mind as you think through these suggestions for development.',
        { 
          main: 'To Enhance Strategic Vision', 
          sub_points: [
            'Consider identifying 2-3 key industry forums annually where sector expertise would add meaningful value to broader industry discussions',
            'Explore opportunities to showcase team achievements through structured internal presentations, focusing on strategic decision-making processes',
            'Look into creating informal mentoring moments by sharing investment thesis development with junior team members during deal analysis'
          ]
        }
      ]
    };
  };

  const [finalReport, setFinalReport] = useState(createEmptyReport());
  const [aiSuggestions, setAiSuggestions] = useState(data);

  return (
    <div className="grid grid-cols-2 gap-6">
      <div className="border-r pr-4">
        <AnalysisSection 
          data={finalReport}
          onUpdate={setFinalReport}
          isAISuggestion={false}
        />
      </div>
      <div className="pl-4">
        <AnalysisSection 
          data={aiSuggestions}
          onUpdate={setAiSuggestions}
          isAISuggestion={true}
        />
      </div>
    </div>
  );
}