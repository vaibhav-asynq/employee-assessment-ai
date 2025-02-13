import React, { useState, useCallback } from 'react';
import { InterviewAnalysis } from '@/lib/types';
import { EditableText } from './shared/EditableText';
import { EditableSubheading } from './shared/EditableSubheading';
import { SectionHeading } from './shared/SectionHeading';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface Path4HumanReportProps {
  data: InterviewAnalysis;
  onUpdate: (data: Partial<InterviewAnalysis>) => void;
}

interface LocalSection {
  id: string;
  heading: string;
  content: string;
}

export function Path4HumanReport({ data, onUpdate }: Path4HumanReportProps) {
  // Convert data to array with stable IDs
  const [sections, setSections] = useState({
    strengths: Object.entries(data.strengths).map(([heading, content], index) => ({
      id: `strength-${heading}`,
      heading,
      content
    })),
    areas: Object.entries(data.areas_to_target).map(([heading, content], index) => ({
      id: `area-${heading}`,
      heading,
      content
    }))
  });

  const updateParentState = useCallback(() => {
    onUpdate({
      strengths: Object.fromEntries(
        sections.strengths.map(s => [s.heading, s.content])
      ),
      areas_to_target: Object.fromEntries(
        sections.areas.map(a => [a.heading, a.content])
      )
    });
  }, [sections, onUpdate]);

  return (
    <div className="space-y-8">
      {/* Strengths */}
      <section className="mb-8">
        <SectionHeading title="STRENGTHS" className="text-xl font-semibold text-gray-900">
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
              setTimeout(updateParentState, 0);
            }}
          >
            <Plus className="h-4 w-4 mr-1" /> Add Subheading
          </Button>
        </SectionHeading>
        
        <div className="space-y-6">
          {sections.strengths.map((strength) => (
            <div key={strength.id} className="mb-8">
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
                  setTimeout(updateParentState, 0);
                }}
                onDelete={() => {
                  setSections(prev => ({
                    ...prev,
                    strengths: prev.strengths.filter(s => s.id !== strength.id)
                  }));
                  setTimeout(updateParentState, 0);
                }}
              />
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
                  setTimeout(updateParentState, 0);
                }}
                minHeight="180px"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Areas to Target */}
      <section className="mb-8">
        <SectionHeading title="AREAS TO TARGET" className="text-xl font-semibold text-gray-900">
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
              setTimeout(updateParentState, 0);
            }}
          >
            <Plus className="h-4 w-4 mr-1" /> Add Subheading
          </Button>
        </SectionHeading>
        
        <div className="space-y-6">
          {sections.areas.map((area) => (
            <div key={area.id} className="mb-8">
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
                  setTimeout(updateParentState, 0);
                }}
                onDelete={() => {
                  setSections(prev => ({
                    ...prev,
                    areas: prev.areas.filter(a => a.id !== area.id)
                  }));
                  setTimeout(updateParentState, 0);
                }}
              />
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
                  setTimeout(updateParentState, 0);
                }}
                minHeight="180px"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Generate Next Steps Button */}
      <div className="mt-8 flex justify-center">
        <Button 
          size="lg"
          onClick={() => {
            console.log('Generate Next Steps clicked');
          }}
        >
          Generate Next Steps
        </Button>
      </div>
    </div>
  );
}
