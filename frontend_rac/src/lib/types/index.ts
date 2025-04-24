// src/lib/types.ts

export interface SubheadingSection {
  [key: string]: string;
}

export interface NextStepPoint {
  main: string;
  sub_points: string[];
}

export type NextStep = string | NextStepPoint;

export interface InterviewAnalysisOld {
  name: string;
  date: string;
  strengths: SubheadingSection;
  areas_to_target: SubheadingSection;
  next_steps: NextStep[];
}

export type StepNumber = 1 | 2 | 3;

// ADDED SOME TYPES HERE. [BY ZAMAN]
//INFO: mention expected templates
export const templatesIds = {
  base: "base",
  //TODO: remove that, has no reference/use
  fullReport: "full-report",
  coachCompetencies: "coach-competencies",
  coachParagraph: "coach-paragraph",
};
export type TemplateId =
  | (typeof templatesIds)[keyof typeof templatesIds]
  | string;

type StregthsAnalysis = Record<string, string>;
type AreasToTargetAnalysis = Record<string, string>;
export interface InterviewAnalysis {
  name: string;
  date: string;
  strengths: StregthsAnalysis;
  areas_to_target: AreasToTargetAnalysis;
  next_steps: NextStep[];
}
interface OrderItem {
  id: string; // Unique ID
  heading: string;
  content: string;
}
interface OrderedSection {
  order: string[];
  items: Record<string, OrderItem>;
}
export interface OrderedInterviewAnalysis {
  name: string;
  date: string;
  strengths: OrderedSection;
  areas_to_target: OrderedSection;
  next_steps: NextStep[];
}

// Define the FeedbackItem interface to match the actual data structure
export interface FeedbackItem {
  text: string;
  strong?: "yes" | "no";
}

type StregthsFeedback = Record<string, { 
  role: string; 
  feedback: (string | FeedbackItem)[] 
}>;

type AreasToTargetFeedback = Record<
  string,
  { role: string; feedback: (string | FeedbackItem)[] }
>;
export interface FeedbackData {
  strengths: StregthsFeedback;
  areas_to_target: AreasToTargetFeedback;
}

export type AnalysisPath = "base-edit" | "sorted-evidence" | "ai-competencies";
