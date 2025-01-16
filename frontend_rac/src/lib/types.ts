// src/lib/types.ts

export interface SubheadingSection {
  [key: string]: string;
}

export interface NextStepPoint {
  main: string;
  sub_points: string[];
}

export type NextStep = string | NextStepPoint;

export interface InterviewAnalysis {
  name: string;
  date: string;
  strengths: SubheadingSection;
  areas_to_target: SubheadingSection;
  next_steps: NextStep[];
}

export type StepNumber = 1 | 2 | 3;

// New types for split screen functionality
export interface EditSectionProps {
  data: InterviewAnalysis;
  aiData?: InterviewAnalysis;
  onUpdate: (newData: InterviewAnalysis) => void;
  onAIUpdate: (newData: InterviewAnalysis) => void;
}

export interface DragItemData {
  type: 'strength' | 'area' | 'next-step';
  content: string;
  subheading?: string;
  index?: number;
  subPoints?: string[];
  sourceSection: 'strengths' | 'areas_to_target' | 'next_steps';
}