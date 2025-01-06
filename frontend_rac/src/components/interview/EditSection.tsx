// src/components/interview/EditSection.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2 } from 'lucide-react';
import { SectionHeading } from './shared/SectionHeading';
import { EditableSubheading } from './shared/EditableSubheading';
import { EditableText } from './shared/EditableText';
import { InterviewAnalysis, SubheadingSection, NextStep } from '@/lib/types';

interface EditSectionProps {
  data: InterviewAnalysis;
  onUpdate: (newData: InterviewAnalysis) => void;
}

export function EditSection({ data, onUpdate }: EditSectionProps) {
  // Helper functions for updating data
  const updateBasicInfo = (field: 'name' | 'date', value: string) => {
    onUpdate({ ...data, [field]: value });
  };

  const updateSection = (section: keyof InterviewAnalysis, subheading: string, newValue: string) => {
    if (section === 'strengths' || section === 'areas_to_target') {
      onUpdate({
        ...data,
        [section]: {
          ...data[section],
          [subheading]: newValue
        }
      });
    }
  };

  const addSubheading = (section: 'strengths' | 'areas_to_target') => {
    const newKey = `Subheading${Object.keys(data[section]).length + 1}`;
    onUpdate({
      ...data,
      [section]: {
        ...data[section],
        [newKey]: ''
      }
    });
  };

  const addNextStep = (type: 'text' | 'points') => {
    const newStep = type === 'text' ? '' : { main: '', sub_points: [''] };
    onUpdate({
      ...data,
      next_steps: [...data.next_steps, newStep]
    });
  };

  const updateNextStep = (index: number, value: string | NextStep) => {
    const newNextSteps = [...data.next_steps];
    newNextSteps[index] = value;
    onUpdate({ ...data, next_steps: newNextSteps });
  };

  const addSubPoint = (stepIndex: number) => {
    const newNextSteps = [...data.next_steps];
    const step = newNextSteps[stepIndex] as { main: string; sub_points: string[] };
    step.sub_points.push('');
    onUpdate({ ...data, next_steps: newNextSteps });
  };

  const updateSubPoint = (stepIndex: number, subIndex: number, value: string) => {
    const newNextSteps = [...data.next_steps];
    const step = newNextSteps[stepIndex] as { main: string; sub_points: string[] };
    step.sub_points[subIndex] = value;
    onUpdate({ ...data, next_steps: newNextSteps });
  };

  const deleteSubheading = (section: 'strengths' | 'areas_to_target', subheading: string) => {
    const newData = { ...data };
    delete newData[section][subheading];
    onUpdate(newData);
  };

  const deleteNextStep = (index: number) => {
    const newNextSteps = data.next_steps.filter((_, i) => i !== index);
    onUpdate({ ...data, next_steps: newNextSteps });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Edit Analysis</h2>
      
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
            onClick={() => addSubheading('strengths')}
          >
            <Plus className="h-4 w-4 mr-1" /> Add Subheading
          </Button>
        </SectionHeading>
        
        {Object.entries(data.strengths).map(([subheading, text]) => (
          <div key={subheading} className="mb-4">
            <EditableSubheading
              value={subheading}
              onChange={(newValue) => {
                const newStrengths = { ...data.strengths };
                const currentText = newStrengths[subheading];
                delete newStrengths[subheading];
                newStrengths[newValue] = currentText;
                onUpdate({ ...data, strengths: newStrengths });
              }}
              onDelete={() => deleteSubheading('strengths', subheading)}
            />
            <EditableText
              value={text}
              onChange={(newValue) => updateSection('strengths', subheading, newValue)}
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
            onClick={() => addSubheading('areas_to_target')}
          >
            <Plus className="h-4 w-4 mr-1" /> Add Subheading
          </Button>
        </SectionHeading>
        
        {Object.entries(data.areas_to_target).map(([subheading, text]) => (
          <div key={subheading} className="mb-4">
            <EditableSubheading
              value={subheading}
              onChange={(newValue) => {
                const newAreas = { ...data.areas_to_target };
                const currentText = newAreas[subheading];
                delete newAreas[subheading];
                newAreas[newValue] = currentText;
                onUpdate({ ...data, areas_to_target: newAreas });
              }}
              onDelete={() => deleteSubheading('areas_to_target', subheading)}
            />
            <EditableText
              value={text}
              onChange={(newValue) => updateSection('areas_to_target', subheading, newValue)}
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
          <div key={index} className="mb-4 relative group">
            {typeof step === 'string' ? (
              <div className="flex gap-2">
                <EditableText
                  value={step}
                  onChange={(newValue) => updateNextStep(index, newValue)}
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteNextStep(index)}
                  className="text-gray-500 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                {index === 0 ? (
                    <EditableText
                      value={step.main}
                      onChange={(newValue) => updateNextStep(index, { ...step, main: newValue })}
                      className="flex-1"
                    />
                  ) : (
                    <EditableSubheading
                      value={step.main}
                      onChange={(newValue) => updateNextStep(index, { ...step, main: newValue })}
                      onDelete={() => deleteNextStep(index)}
                    />
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteNextStep(index)}
                    className="text-gray-500 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="ml-6 space-y-2">
                  {step.sub_points.map((subPoint, subIndex) => (
                    <div key={subIndex} className="flex gap-2">
                      <Input
                        value={subPoint}
                        onChange={(e) => updateSubPoint(index, subIndex, e.target.value)}
                      />
                      <Button
                        variant="outline"
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